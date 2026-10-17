# frozen_string_literal: true

module Preview
  class App
    # ------------------------------------------------------------------ cart API
    def json_wanted?(req, ext)
      !ext.nil? || req.xhr? || req.wants_json? || req.headers['content-type'].to_s.include?('application/json')
    end

    def body_params(req)
      req.json.is_a?(Hash) ? req.json : req.form
    end

    def sections_for(req, cart, params)
      secs = params['sections']
      return nil if secs.nil? || secs == '' || secs == []
      surl = params['sections_url'] || req.referer_path || '/'
      sreq = Request.new
      sreq.method = 'GET'
      spath, sqs = surl.split('?', 2)
      sreq.path = spath
      sreq.raw_path = surl
      sreq.params = Request.parse_query(sqs)
      sreq.headers = req.headers
      sreq.cookies = req.cookies
      rc = new_rc(sreq, cart)
      setup_page(rc, spath.chomp('/').then { |p| p.empty? ? '/' : p })
      render_sections_map(rc, secs)
    end

    def cart_error(req, ext, err)
      if json_wanted?(req, ext)
        Response.json({ 'status' => err.status, 'message' => err.message, 'description' => err.description,
                        'errors' => err.description }, err.status)
      else
        Response.redirect('/cart')
      end
    end

    def normalize_items(params)
      items = params['items']
      items = items.values_at(*items.keys.sort_by(&:to_i)) if items.is_a?(Hash)
      if items.is_a?(Array) && !items.empty?
        items.map { |it| it.is_a?(Hash) ? it : { 'id' => it } }
      else
        [{ 'id' => params['id'], 'quantity' => params['quantity'], 'properties' => params['properties'],
           'selling_plan' => params['selling_plan'] }]
      end
    end

    def cart_add(req, cart, ext)
      params = body_params(req)
      params = req.params.transform_values(&:first).merge(params) if req.get?
      items = normalize_items(params)
      rc = new_rc(req, cart)
      added = []
      begin
        items.each do |it|
          raise CartError.new('Cart Error', 'Parameter missing or invalid: Required parameter missing or invalid: items', 400) if it['id'].to_s.empty?
          props = it['properties'].is_a?(Hash) ? it['properties'].transform_values { |v| v.is_a?(Array) ? v.join(', ') : v.to_s } : {}
          line = cart.add(rc.store, it['id'], it['quantity'] || 1, props, it['selling_plan'])
          added << line
        end
      rescue CartError => e
        return cart_error(req, ext, e)
      end
      return Response.redirect('/cart') unless json_wanted?(req, ext)

      rc2 = new_rc(req, cart)
      cd = rc2.cart_drop
      lines = added.map { |l| cd.items.find { |i| i.key == l.key }&.as_json }.compact
      body = params['items'] ? { 'items' => lines } : (lines.first || {})
      if (s = sections_for(req, cart, params))
        body['sections'] = s
      end
      Response.json(body)
    end

    def cart_change(req, cart, ext)
      params = req.get? ? req.params.transform_values(&:first) : body_params(req)
      rc = new_rc(req, cart)
      begin
        cart.change(rc.store, line_index: params['line'], id: params['line'] ? nil : params['id'],
                              quantity: params.key?('quantity') ? params['quantity'] : nil,
                              properties: params['properties'].is_a?(Hash) ? params['properties'] : nil)
      rescue CartError => e
        return cart_error(req, ext, e)
      end
      return Response.redirect('/cart') unless json_wanted?(req, ext) && !req.get? || ext
      cart_response(req, cart, params)
    end

    def cart_update(req, cart, ext)
      params = body_params(req)
      rc = new_rc(req, cart)
      if (u = params['updates'])
        case u
        when Hash
          u.each do |k, q|
            if k.to_s.match?(/\A\d+\z/) && k.to_i < 1000 && !k.include?(':') && cart.lines[k.to_i]
              cart.change(rc.store, line_index: k.to_i + 1, quantity: q)
            elsif cart.find_line(k)
              cart.change(rc.store, id: k, quantity: q)
            elsif q.to_i.positive?
              begin
                cart.add(rc.store, k, q)
              rescue CartError
                nil
              end
            end
          end
        when Array
          lines = cart.lines.dup
          u.each_with_index { |q, i| (l = lines[i]) && cart.change(rc.store, id: l.key, quantity: q) }
        end
      end
      cart.note = params['note'].to_s if params.key?('note')
      cart.attributes = cart.attributes.merge(params['attributes']) if params['attributes'].is_a?(Hash)
      cart.discount_codes = params['discount'].to_s.split(',').map(&:strip).reject(&:empty?) if params.key?('discount')
      unless json_wanted?(req, ext)
        return Response.redirect('/checkout') if params.key?('checkout')
        return Response.redirect('/cart')
      end
      cart_response(req, cart, params)
    end

    def cart_clear(req, cart, ext)
      cart.clear
      return Response.redirect('/cart') unless json_wanted?(req, ext)
      cart_response(req, cart, body_params(req))
    end

    def cart_response(req, cart, params)
      body = new_rc(req, cart).cart_drop.as_json
      if (s = sections_for(req, cart, params || {}))
        body['sections'] = s
      end
      Response.json(body)
    end

    # ------------------------------------------------------------------ predictive search
    def predictive_search(req, cart, ext)
      rc = new_rc(req, cart)
      q = req.params['q']&.first.to_s
      q = req.param('q').to_s if q.empty?
      types = (req.params['resources[type]']&.first || 'query,product,collection,page,article').split(',').map(&:strip)
      limit = (req.params['resources[limit]']&.first || 10).to_i.clamp(1, 10)
      rc.page_type = 'search'
      rc.template_name = 'search'
      rc.predictive_drop = PredictiveSearchDrop.new(rc, q, types, limit)
      if (sid = req.params['section_id']&.first) && !sid.empty?
        html = render_section_api(rc, sid)
        return Response.html(html.to_s, html ? 200 : 404, error_headers(rc))
      end
      res = rc.predictive_drop.resources
      body = {
        'resources' => {
          'results' => {
            'products' => res['products'].map { |p| predictive_product_json(rc, p) },
            'collections' => res['collections'].map { |c| c.as_json.merge('url' => c.url) },
            'pages' => res['pages'].map(&:as_json),
            'articles' => res['articles'].map { |a| a.as_json.merge('image' => a.image&.src, 'summary_html' => a.excerpt) },
            'queries' => res['queries'].map(&:as_json)
          }
        }
      }
      Response.json(body)
    end

    def predictive_product_json(rc, pd)
      j = pd.as_json(js_endpoint: true)
      v = pd.selected_or_first_available_variant
      {
        'available' => pd.available, 'body' => pd.description, 'compare_at_price_max' => format('%.2f', (pd.compare_at_price_max || 0) / 100.0),
        'compare_at_price_min' => format('%.2f', (pd.compare_at_price_min || 0) / 100.0), 'handle' => pd.handle, 'id' => pd.id,
        'image' => pd.featured_image&.src, 'price' => format('%.2f', pd.price / 100.0), 'price_max' => format('%.2f', pd.price_max / 100.0),
        'price_min' => format('%.2f', pd.price_min / 100.0), 'tags' => pd.tags, 'title' => pd.title, 'type' => pd.type,
        'url' => "#{pd.url}?_pos=1&_psq=#{Util.url_encode(rc.query_param('q'))}&_ss=e&_v=1.0", 'vendor' => pd.vendor,
        'featured_image' => pd.featured_image&.then { |i| { 'alt' => i.alt, 'aspect_ratio' => i.aspect_ratio, 'height' => i.height, 'url' => i.src, 'width' => i.width } },
        'variants' => j['variants'].map { |x| x.slice('available', 'compare_at_price', 'id', 'price', 'title', 'sku') },
        'first_available_variant' => v ? { 'id' => v.id } : nil
      }
    end

    # ------------------------------------------------------------------ recommendations
    def recommendations(req, cart, ext)
      rc = new_rc(req, cart)
      pid = req.params['product_id']&.first
      prod = rc.store.product_by_id(pid) || rc.store.product(pid.to_s)
      limit = (req.params['limit']&.first || 10).to_i.clamp(1, 10)
      intent = req.params['intent']&.first || 'related'
      rc.page_type = 'product'
      rc.template_name = 'product'
      if prod
        rc.main_product = prod
        rc.resource_handle = prod.handle
        rc.template_suffix = prod.template_suffix
      end
      rc.recommendations_drop = RecommendationsDrop.new(rc, prod, limit, intent)
      if (sid = req.params['section_id']&.first) && !sid.empty?
        html = render_section_api(rc, sid)
        return Response.html(html.to_s, html ? 200 : 404, error_headers(rc))
      end
      return Response.json({ 'status' => 404, 'message' => 'Product not found', 'description' => 'Product not found' }, 404) unless prod
      Response.json({ 'intent' => intent, 'products' => rc.recommendations_drop.products.map { |p| p.as_json(js_endpoint: true) } })
    end

    # ------------------------------------------------------------------ product JSON endpoints
    def product_json(req, cart, handle, kind)
      rc = new_rc(req, cart)
      p = rc.store.product(handle)
      return Response.json({ 'status' => 404, 'message' => 'Not Found', 'description' => 'Not Found' }, 404) unless p
      pd = rc.product_drop(p)
      if kind == 'js'
        Response.json(pd.as_json(js_endpoint: true))
      else
        Response.json({ 'product' => admin_product_json(rc, p) })
      end
    end

    def admin_product_json(rc, p)
      {
        'id' => p.id, 'title' => p.title, 'body_html' => p.body_html, 'vendor' => p.vendor, 'product_type' => p.product_type,
        'created_at' => rc.iso(p.created_at), 'handle' => p.handle, 'updated_at' => rc.iso(p.updated_at),
        'published_at' => rc.iso(p.published_at), 'template_suffix' => p.template_suffix, 'published_scope' => 'web',
        'tags' => p.tags.join(', '),
        'variants' => p.variants.map do |v|
          { 'id' => v.id, 'title' => v.title, 'option1' => v.options[0], 'option2' => v.options[1], 'option3' => v.options[2],
            'sku' => v.sku, 'requires_shipping' => v.requires_shipping, 'taxable' => v.taxable,
            'featured_image' => v.image ? rc.image_drop(v.image).as_json : nil, 'available' => v.available?,
            'price' => format('%.2f', v.price / 100.0), 'grams' => v.weight,
            'compare_at_price' => v.compare_at_price ? format('%.2f', v.compare_at_price / 100.0) : nil, 'position' => v.position,
            'product_id' => p.id, 'created_at' => rc.iso(p.created_at), 'updated_at' => rc.iso(p.updated_at) }
        end,
        'images' => p.images.map { |i| rc.image_drop(i).as_json },
        'image' => p.images.first ? rc.image_drop(p.images.first).as_json : nil,
        'options' => p.options.map { |o| { 'name' => o.name, 'position' => o.position, 'values' => o.values.map(&:name) } }
      }
    end

    def products_json(req, cart, handle)
      rc = new_rc(req, cart)
      list = handle ? rc.store.collection(handle)&.products : rc.store.products
      return Response.json({ 'products' => [] }, 404) unless list
      limit = (req.params['limit']&.first || 30).to_i.clamp(1, 250)
      page = [(req.params['page']&.first || 1).to_i, 1].max
      Response.json({ 'products' => list.slice((page - 1) * limit, limit).to_a.map { |p| admin_product_json(rc, p) } })
    end

    # ------------------------------------------------------------------ forms
    def contact_post(req, cart)
      params = body_params(req)
      type = params['form_type'] || 'contact'
      contact = params['contact'].is_a?(Hash) ? params['contact'] : {}
      email = contact['email'].to_s.strip
      back = req.referer_path || '/'
      back = '/' if back.start_with?('/contact')
      ref_q = begin
        URI.parse(req.headers['referer'].to_s).query
      rescue StandardError
        nil
      end
      base_params = Request.parse_query(ref_q).reject { |k, _| %w[contact_posted customer_posted].include?(k) }
      unless email.match?(/\A[^@\s]+@[^@\s]+\.[^@\s]+\z/)
        flash_set(cart.token, type, { 'errors' => { 'email' => (store.shop['primary_locale'].to_s.start_with?('nl') ? 'is ongeldig' : 'is invalid') }, 'values' => contact })
        q = URI.encode_www_form(base_params.flat_map { |k, vs| vs.map { |v| [k, v] } })
        return Response.redirect(q.empty? ? back : "#{back}?#{q}")
      end
      key = type == 'customer' ? 'customer_posted' : 'contact_posted'
      pairs = base_params.flat_map { |k, vs| vs.map { |v| [k, v] } } + [[key, 'true']]
      flash_set(cart.token, type, { 'posted' => true, 'values' => contact })
      Response.redirect("#{back}?#{URI.encode_www_form(pairs)}")
    end

    def password_post(req, cart)
      params = body_params(req)
      pw = params['password'].to_s
      expected = store.shop['password'] || 'preview'
      if pw == expected
        Response.redirect('/')
      else
        flash_set(cart.token, 'storefront_password', { 'errors' => { 'password' => 'Onjuist wachtwoord' } })
        Response.redirect('/password')
      end
    end
  end

  class RenderContext
    def form_drop(type, id, _obj)
      flash = (@form_flash || {})[type] || {}
      posted = false
      posted = true if type == 'contact' && query_param('contact_posted') == 'true'
      posted = true if type == 'customer' && query_param('customer_posted') == 'true'
      posted ||= flash['posted'] ? true : false
      FormDrop.new(self, type, id, posted, flash['errors'], flash['values'])
    end
  end

  class GiftCardDrop < BaseDrop
    def initialize(rc, code)
      super(rc)
      @code = code
    end

    def model_key = @code
    def code = @code.upcase.ljust(16, 'X')[0, 16]
    def last_four_characters = code[-4..]
    def balance = 5000
    def initial_value = 5000
    def currency = rc.store.shop['currency']
    def enabled = true
    def expired = false
    def expires_on = nil
    def pass_url = nil
    def qr_identifier = "preview-#{@code}"
    def url = "/gift_cards/#{@code}"
    def customer = nil
    def message = nil
    def product = nil
    def properties = {}
    def send_on = nil
    def recipient = nil
    def template_suffix = nil
  end
end
