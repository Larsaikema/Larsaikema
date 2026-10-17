# frozen_string_literal: true

module Preview
  class App
    attr_reader :theme, :data_path, :images_dir, :env, :carts, :shims_dir

    MIME = {
      '.css' => 'text/css; charset=utf-8', '.js' => 'text/javascript; charset=utf-8', '.mjs' => 'text/javascript; charset=utf-8',
      '.json' => 'application/json; charset=utf-8', '.svg' => 'image/svg+xml', '.png' => 'image/png', '.jpg' => 'image/jpeg',
      '.jpeg' => 'image/jpeg', '.gif' => 'image/gif', '.webp' => 'image/webp', '.avif' => 'image/avif', '.ico' => 'image/x-icon',
      '.woff2' => 'font/woff2', '.woff' => 'font/woff', '.ttf' => 'font/ttf', '.otf' => 'font/otf', '.txt' => 'text/plain; charset=utf-8',
      '.html' => 'text/html; charset=utf-8', '.map' => 'application/json', '.mp4' => 'video/mp4', '.webm' => 'video/webm',
      '.pdf' => 'application/pdf'
    }.freeze

    def initialize(theme_dir:, data_path:, images_dir: nil)
      @theme = Theme.new(theme_dir)
      @data_path = File.expand_path(data_path)
      @images_dir = images_dir ? File.expand_path(images_dir) : File.join(File.dirname(@data_path), 'images')
      @carts = CartStore.new
      @shims_dir = File.expand_path('../shims', __dir__)
      @flash = {}
      @flash_mutex = Mutex.new
      @env = Liquid::Environment.build(error_mode: :lax) do |e|
        e.register_filter(ShopifyFilters)
        e.register_tag('section', Tags::Section)
        e.register_tag('sections', Tags::Sections)
        e.register_tag('schema', Tags::RawNoOutput)
        e.register_tag('stylesheet', Tags::RawNoOutput)
        e.register_tag('javascript', Tags::RawNoOutput)
        e.register_tag('style', Tags::Style)
        e.register_tag('layout', Tags::Layout)
        e.register_tag('render', Tags::Render)
        e.register_tag('content_for', Tags::ContentFor)
        e.register_tag('paginate', Tags::Paginate)
        e.register_tag('form', Tags::Form)
      end
    end

    def store = Store.load(@data_path, @images_dir)

    # ------------------------------------------------------------------ flash (form errors across redirects)
    def flash_set(token, key, value)
      @flash_mutex.synchronize { (@flash[token] ||= {})[key] = value }
    end

    def flash_take(token)
      @flash_mutex.synchronize { @flash.delete(token) || {} }
    end

    # ------------------------------------------------------------------ entry
    def call(req)
      path = req.path
      return static(req) if path.start_with?('/assets/', '/cdn/', '/compiled_assets/') || path == '/favicon.ico'
      return placeholder_theme_page(req) unless @theme.valid?

      cart = @carts.fetch(req.cookies['cart'])
      res = route(req, cart)
      unless req.cookies['cart'] == cart.token
        res.headers['set-cookie'] = "cart=#{cart.token}; path=/; SameSite=Lax"
      end
      res
    end

    def placeholder_theme_page(_req)
      Response.html(<<~HTML, 200, { 'x-liquid-errors' => '0' })
        <!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Thema nog niet aanwezig</title><style>body{font:16px/1.5 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f4f4f2;color:#222}main{max-width:36rem;padding:2rem}</style></head>
        <body><main><h1>Nog geen thema</h1><p>De preview-server draait, maar <code>#{Util.h(@theme.root)}/layout/theme.liquid</code> bestaat nog niet.</p><p>Zodra het thema er staat, ververs je deze pagina.</p></main></body></html>
      HTML
    end

    def new_rc(req, cart)
      RenderContext.new(self, req, cart)
    end

    def route(req, cart)
      path = req.path
      path = path.chomp('/') if path.length > 1 && path.end_with?('/')

      # ---- AJAX / API
      case path
      when '/__preview/routes.json' then return Response.json(preview_routes)
      when %r{\A/cart/add(\.js|\.json)?\z} then return req.post? || req.params['id'] ? cart_add(req, cart, Regexp.last_match(1)) : not_found(req, cart)
      when %r{\A/cart/change(\.js|\.json)?\z} then return cart_change(req, cart, Regexp.last_match(1))
      when %r{\A/cart/update(\.js|\.json)?\z} then return cart_update(req, cart, Regexp.last_match(1))
      when %r{\A/cart/clear(\.js|\.json)?\z} then return cart_clear(req, cart, Regexp.last_match(1))
      when %r{\A/cart\.(js|json)\z} then return Response.json(new_rc(req, cart).cart_drop.as_json)
      when '/cart'
        return cart_update(req, cart, nil) if req.post?
      when %r{\A/search/suggest(\.json)?\z} then return predictive_search(req, cart, Regexp.last_match(1))
      when %r{\A/recommendations/products(\.json)?\z} then return recommendations(req, cart, Regexp.last_match(1))
      when %r{\A/products/([^/]+)\.(js|json|oembed)\z} then return product_json(req, cart, Regexp.last_match(1), Regexp.last_match(2))
      when %r{\A/collections/([^/]+)/products\.json\z}, '/products.json' then return products_json(req, cart, Regexp.last_match(1))
      when '/contact' then return contact_post(req, cart) if req.post?
      when '/localization' then return Response.redirect(req.param('return_to') || req.referer_path || '/')
      when '/checkout', %r{\A/checkouts/} then return checkout_page(req, cart)
      when '/password'
        return password_post(req, cart) if req.post?
      end
      if req.post? && path =~ %r{\A/blogs/[^/]+/[^/]+/comments\z}
        return Response.redirect("#{path.sub(%r{/comments\z}, '')}?comment_posted=true#comment_form")
      end
      if req.post? && path.start_with?('/account')
        return Response.redirect('/account')
      end
      if %r{\A/cart/change\z}.match?(path) && req.get?
        return cart_change(req, cart, nil)
      end

      rc = new_rc(req, cart)
      apply_flash(rc, cart)
      setup = setup_page(rc, path)
      return setup if setup.is_a?(Response)
      render_response(req, rc)
    end

    # Non-Shopify helper endpoint for tools/check.mjs: every renderable resource in the fixture.
    def preview_routes
      st = store
      {
        'theme' => @theme.root, 'data' => @data_path,
        'collections' => st.collections_with_all.map(&:handle),
        'products' => st.products.map do |p|
          { 'handle' => p.handle, 'variants' => p.variants.map(&:id), 'available' => p.available?,
            'first_available_variant' => p.first_available_variant&.id }
        end,
        'pages' => st.pages.map(&:handle),
        'blogs' => st.blogs.map { |b| { 'handle' => b.handle, 'articles' => b.articles.map(&:handle) } },
        'policies' => st.policies.map(&:handle),
        'search_terms' => st.products.first(3).map { |p| p.title.split.first.to_s.downcase }.uniq
      }
    end

    def apply_flash(rc, cart)
      rc.form_flash = flash_take(cart.token)
    end

    # Sets page type/resources on the rc. Returns a Response for redirects/404.
    def setup_page(rc, path)
      st = rc.store
      view = rc.query_param('view')
      rc.template_suffix = view if view && !view.empty?
      case path
      when '', '/'
        rc.page_type = 'index'
        rc.template_name = 'index'
      when '/collections'
        rc.page_type = 'list-collections'
        rc.template_name = 'list-collections'
      when %r{\A/collections/([^/]+)/products/([^/]+)\z}
        p = st.product(Regexp.last_match(2))
        return set_404(rc) unless p
        setup_product(rc, p)
        c = st.collection(Regexp.last_match(1))
        rc.main_collection = nil
        rc.instance_variable_set(:@within_collection, c)
      when %r{\A/collections/([^/]+)(?:/([^/]+))?\z}
        c = st.collection(Regexp.last_match(1))
        return set_404(rc) unless c
        rc.page_type = 'collection'
        rc.template_name = 'collection'
        rc.main_collection = c
        rc.resource_handle = c.handle
        rc.template_suffix ||= c.template_suffix
        if (tags = Regexp.last_match(2))
          rc.current_tags = tags.split('+')
        end
      when %r{\A/products/([^/]+)\z}
        p = st.product(Regexp.last_match(1))
        return set_404(rc) unless p
        setup_product(rc, p)
      when %r{\A/variants/(\d+)\z}
        v = st.variant(Regexp.last_match(1))
        return set_404(rc) unless v
        unless rc.req.params['section_id'] || rc.req.params['sections']
          return Response.redirect("/products/#{v.product.handle}?variant=#{v.id}")
        end
        rc.req.params['variant'] = [v.id.to_s]
        setup_product(rc, v.product)
      when '/cart'
        rc.page_type = 'cart'
        rc.template_name = 'cart'
      when '/search'
        rc.page_type = 'search'
        rc.template_name = 'search'
        q = rc.query_param('q').to_s
        types = rc.query_param('type').to_s.split(',').map(&:strip).reject(&:empty?)
        types = %w[product page article] if types.empty?
        rc.search_drop = SearchDrop.new(rc, q, types, !q.strip.empty?)
      when %r{\A/pages/([^/]+)\z}
        pg = st.page(Regexp.last_match(1))
        return set_404(rc) unless pg
        rc.page_type = 'page'
        rc.template_name = 'page'
        rc.main_page = pg
        rc.resource_handle = pg.handle
        rc.template_suffix ||= pg.template_suffix
      when %r{\A/blogs/([^/]+)(?:/tagged/([^/]+))?\z}
        b = st.blog(Regexp.last_match(1))
        return set_404(rc) unless b
        rc.page_type = 'blog'
        rc.template_name = 'blog'
        rc.main_blog = b
        rc.resource_handle = b.handle
        rc.template_suffix ||= b.template_suffix
        rc.current_tags = [Regexp.last_match(2)] if Regexp.last_match(2)
      when %r{\A/blogs/([^/]+)/([^/]+)\z}
        b = st.blog(Regexp.last_match(1))
        a = b&.articles&.find { |x| x.handle == Regexp.last_match(2) }
        return set_404(rc) unless a
        rc.page_type = 'article'
        rc.template_name = 'article'
        rc.main_blog = b
        rc.main_article = a
        rc.resource_handle = a.handle
        rc.template_suffix ||= a.template_suffix
      when %r{\A/policies/([^/]+)\z}
        pol = st.policy(Regexp.last_match(1))
        return set_404(rc) unless pol
        rc.page_type = 'policy'
        rc.template_name = 'page'
        rc.page_title_override = pol.title
        rc.template_json_override = :policy
        rc.instance_variable_set(:@policy, pol)
      when '/password'
        rc.page_type = 'password'
        rc.template_name = 'password'
      when %r{\A/gift_cards/([^/]+)\z}
        rc.page_type = 'gift_card'
        rc.template_name = 'gift_card'
        rc.gift_card = GiftCardDrop.new(rc, Regexp.last_match(1))
      when %r{\A/account(/.*)?\z}
        rc.page_type = 'customers/account'
        rc.template_name = 'account'
        rc.template_directory = 'customers'
        rc.template_json_override = :account
        rc.page_title_override = rc.locale.start_with?('nl') ? 'Account' : 'Account'
      else
        return set_404(rc)
      end
      nil
    end

    def setup_product(rc, p)
      rc.page_type = 'product'
      rc.template_name = 'product'
      rc.main_product = p
      rc.resource_handle = p.handle
      rc.template_suffix ||= p.template_suffix
    end

    def set_404(rc)
      rc.page_type = '404'
      rc.template_name = '404'
      rc.status = 404
      nil
    end

    # ------------------------------------------------------------------ page rendering
    def render_response(req, rc)
      if (sid = req.params['section_id']&.first) && !sid.empty?
        html = render_section_api(rc, sid)
        return Response.html(html.to_s, html ? 200 : 404, error_headers(rc)) if html
        return Response.html('', 404, error_headers(rc))
      end
      if (secs = req.params['sections']&.first)
        map = render_sections_map(rc, secs)
        return Response.json(map, 200, error_headers(rc))
      end
      html = if rc.template_json_override == :policy
               render_policy_page(rc)
             elsif rc.template_json_override == :account
               render_account_page(rc)
             else
               rc.render_page
             end
      html = postprocess(html, rc)
      Response.html(html, rc.status, error_headers(rc))
    end

    def error_headers(rc)
      h = { 'x-liquid-errors' => rc.errors.size.to_s, 'x-translation-missing' => rc.missing_translations.size.to_s,
            'cache-control' => 'no-store', 'x-preview-unknown-props' => rc.unknown_props.keys.sort.join(' ')[0, 4000] }
      h['x-preview-template'] = [rc.template_directory, rc.template_name].compact.join('/') + (rc.template_suffix ? ".#{rc.template_suffix}" : '')
      h
    end

    def postprocess(html, rc)
      out = rewrite_cdn(html)
      summary = +"\n<!-- preview: template=#{rc.template_name}#{rc.template_suffix ? ".#{rc.template_suffix}" : ''} liquid_errors=#{rc.errors.size} missing_translations=#{rc.missing_translations.size}"
      rc.errors.uniq.first(50).each { |e| summary << "\n  ERROR: #{e.gsub('--', '- -')}" }
      rc.missing_translations.first(50).each { |k| summary << "\n  MISSING TRANSLATION: #{k}" }
      rc.internal_errors.first(10).each { |e| summary << "\n  INTERNAL: #{e.gsub('--', '- -')}" }
      rc.unknown_props.keys.sort.each { |k| summary << "\n  UNKNOWN PROPERTY: #{k}" } if ENV['PREVIEW_DEBUG_PROPS']
      summary << "\n-->\n"
      unless rc.internal_errors.empty?
        $stderr.puts "[preview] internal errors on #{rc.path}:\n#{rc.internal_errors.first(5).join("\n")}"
      end
      out + summary
    end

    def rewrite_cdn(html)
      html.gsub(%r{(?:https:)?//cdn\.shopify\.com/storefront/}, '/cdn/shopifycloud/storefront/')
    end

    # Section Rendering API: ?section_id=
    def resolve_section(rc, sid)
      if (m = sid.match(/\Atemplate--\d+__(.+)\z/))
        data = rc.template_json
        sec = data && data['sections'][m[1]]
        return [sid, sec['type'], sec, 'template'] if sec
      end
      if (m = sid.match(/\Asections--\d+__(.+)\z/))
        @theme.files('sections', '.json').each do |f|
          g = rc.section_group(f.sub('.json', ''))
          next unless g && g['sections']
          sec = g['sections'][m[1]]
          return [sid, sec['type'], sec, g['type'] || 'group'] if sec
        end
      end
      data = rc.template_json
      if data && data['sections'][sid]
        sec = data['sections'][sid]
        return ["template--#{rc.template_id(rc.template_name)}__#{sid}", sec['type'], sec, 'template']
      end
      return [sid, sid, rc.static_section_data(sid), 'static'] if @theme.exist?("sections/#{sid}.liquid")
      nil
    end

    def render_section_api(rc, sid)
      found = resolve_section(rc, sid)
      return nil unless found
      id, type, data, loc = found
      html = rc.render_section(sid, type, data, location: loc)
      html = html.sub(%(id="shopify-section-#{sid}"), %(id="shopify-section-#{id}")) if id != sid
      rewrite_cdn(html)
    end

    def render_sections_map(rc, secs)
      ids = secs.is_a?(Array) ? secs : secs.to_s.split(',')
      ids.map(&:strip).reject(&:empty?).first(5).to_h { |sid| [sid, render_section_api(rc, sid)] }
    end

    def render_policy_page(rc)
      pol = rc.instance_variable_get(:@policy)
      content = <<~HTML
        <div class="shopify-policy__container">
          <div class="shopify-policy__title"><h1>#{Util.h(pol.title)}</h1></div>
          <div class="shopify-policy__body"><div class="rte">#{pol.body}</div></div>
        </div>
        <style>.shopify-policy__container{max-width:65ch;margin:0 auto;padding:2rem 1rem}.shopify-policy__title{text-align:center}</style>
      HTML
      postprocess_layout(rc, content)
    end

    def render_account_page(rc)
      nl = rc.locale.start_with?('nl')
      content = <<~HTML
        <div class="preview-account" style="max-width:40rem;margin:0 auto;padding:4rem 1rem;text-align:center">
          <h1>#{nl ? 'Inloggen' : 'Log in'}</h1>
          <p>#{nl ? 'Klantaccounts worden door Shopify gehost (nieuwe klantaccounts). In deze lokale preview is inloggen niet beschikbaar.' : 'Customer accounts are hosted by Shopify (new customer accounts). Logging in is not available in this local preview.'}</p>
          <p><a href="/">#{nl ? 'Verder winkelen' : 'Continue shopping'}</a></p>
        </div>
      HTML
      postprocess_layout(rc, content)
    end

    def postprocess_layout(rc, content)
      html = rc.render_layout('theme', content)
      html.sub(RenderContext::HEADER_TOKEN) { content_for_header(rc) }
    end

    def checkout_page(req, cart)
      rc = new_rc(req, cart)
      rc.page_type = 'checkout'
      rc.template_name = 'checkout'
      cd = rc.cart_drop
      rows = cd.items.map { |i| "<tr><td>#{Util.h(i.title)}</td><td>#{i.quantity}</td><td>#{Util.money_format_apply(i.final_line_price, rc.store.shop['money_format'])}</td></tr>" }.join
      Response.html(<<~HTML)
        <!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Afrekenen – preview</title>
        <style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem}td{padding:.25rem .75rem}</style></head>
        <body><h1>Afrekenen (preview)</h1><p>De Shopify-checkout draait niet lokaal. Dit zou er in de winkelwagen naar de checkout gaan:</p>
        <table>#{rows}</table><p><strong>Totaal: #{Util.money_format_apply(cd.total_price, rc.store.shop['money_format'])}</strong></p><p><a href="/cart">Terug naar winkelwagen</a></p></body></html>
      HTML
    end

    # ------------------------------------------------------------------ content_for_header
    def content_for_header(rc)
      shop = rc.store.shop
      info = @theme.settings_schema_info
      theme_obj = { 'name' => info['theme_name'] || File.basename(@theme.root), 'id' => Util.stable_id(@theme.root, 100_000_000_000),
                    'schema_name' => info['theme_name'], 'schema_version' => info['theme_version'], 'theme_store_id' => nil, 'role' => 'main' }
      v = @theme.compiled_version
      out = +''
      out << %(<meta name="shopify-preview" content="local">\n)
      out << "<script>window.Shopify = window.Shopify || {};\n"
      out << "Shopify.shop = #{JSON.generate("#{Util.handleize(shop['name'])}.myshopify.com")};\n"
      out << "Shopify.locale = #{JSON.generate(rc.locale)};\n"
      out << "Shopify.currency = #{JSON.generate({ 'active' => shop['currency'], 'rate' => '1.0' })};\n"
      out << "Shopify.country = #{JSON.generate(shop['country'] || 'NL')};\n"
      out << "Shopify.theme = #{JSON.generate(theme_obj)};\n"
      out << "Shopify.theme.handle = \"null\";\nShopify.theme.style = {\"id\":null,\"handle\":null};\n"
      out << "Shopify.cdnHost = location.host + \"/cdn\";\n"
      out << "Shopify.routes = Shopify.routes || {};\nShopify.routes.root = \"/\";\n"
      out << "Shopify.designMode = false;\n"
      out << "Shopify.PaymentButton = Shopify.PaymentButton || { init: function () {} };\n"
      out << "Shopify.loadFeatures = Shopify.loadFeatures || function (features, cb) { if (typeof cb === 'function') { try { cb(new Error('feature not available in preview')); } catch (e) {} } };\n"
      out << "</script>\n"
      out << %(<script src="/cdn/shopifycloud/storefront/standard-actions.js"></script>\n)
      rc.preloads.each do |url, as|
        out << %(<link rel="preload" href="#{Util.h(url)}" as="#{as}"#{as == 'font' ? ' crossorigin' : ''}>\n)
      end
      out << %(<link rel="stylesheet" href="/compiled_assets/styles.css?v=#{v}">\n) unless @theme.compiled_asset(:css).empty?
      out << %(<script src="/compiled_assets/scripts.js?v=#{v}" defer="defer"></script>\n) unless @theme.compiled_asset(:js).empty?
      out << <<~CSS
        <style id="shopify-dynamic-checkout">.shopify-payment-button__button{border-radius:4px;border:none;box-shadow:0 0 0 0 transparent;color:#fff;cursor:pointer;display:block;font-size:1em;font-weight:500;line-height:1;text-align:center;width:100%;transition:background .2s ease-in-out}.shopify-payment-button__button--unbranded{background-color:#1990c6;padding:1em 2em}.shopify-payment-button__button--unbranded:hover:not([disabled]){background-color:#136f99}.shopify-payment-button__more-options{background:transparent;border:0 none;cursor:pointer;display:block;font-size:.875em;margin-top:1em;text-align:center;text-decoration:underline;width:100%}.shopify-payment-button__button--hidden{display:none!important}</style>
      CSS
      out
    end

    # ------------------------------------------------------------------ static files
    def static(req)
      path = req.path
      case path
      when '/favicon.ico' then return Response.new(204, {}, '')
      when %r{\A/compiled_assets/styles\.css\z}
        return Response.new(200, { 'content-type' => MIME['.css'], 'cache-control' => 'no-cache' }, @theme.compiled_asset(:css))
      when %r{\A/compiled_assets/scripts\.js\z}
        return Response.new(200, { 'content-type' => MIME['.js'], 'cache-control' => 'no-cache' }, @theme.compiled_asset(:js))
      when %r{\A/assets/(.+)\z} then return theme_asset(req, Regexp.last_match(1))
      when %r{\A/cdn/(?:images|shop/files|shop/products)/(.+)\z} then return image_file(req, Regexp.last_match(1))
      when %r{\A/cdn/fonts/([^/]+)/(.+)\z}
        f = Fonts.resolve_file(Regexp.last_match(1), Regexp.last_match(2))
        return send_file(f) if f
      when '/cdn/shopifycloud/storefront/standard-events.js'
        return send_file(File.join(@shims_dir, 'standard-events.js'))
      when '/cdn/shopifycloud/storefront/standard-actions.js'
        return send_file(File.join(@shims_dir, 'standard-actions.js'))
      when %r{\A/cdn/shopifycloud/shopify/assets/(.+)\z}
        rel = Regexp.last_match(1)
        return Response.text('Forbidden', 403) if rel.include?('..')
        return send_file(File.join(@shims_dir, 'shopify-assets', rel))
      when %r{\A/cdn/shopifycloud/payment-icons/(.+)\.svg\z}
        return Response.new(200, { 'content-type' => MIME['.svg'] }, PaymentIcons.svg(Regexp.last_match(1), 'icon'))
      end
      Response.text('Not found', 404)
    end

    def theme_asset(_req, name)
      name = name.split('?').first
      return Response.text('Forbidden', 403) if name.include?('..')
      rel = "assets/#{name}"
      if @theme.exist?(rel)
        return send_file(@theme.path(rel))
      elsif @theme.exist?("#{rel}.liquid")
        rc = RenderContext.new(self, Request.new.tap { |r| r.path = '/'; r.headers['host'] = 'localhost' }, Cart.new('asset'))
        rc.page_type = 'asset'
        body = rc.render_liquid_string(@theme.read("#{rel}.liquid"), nil)
        return Response.new(200, { 'content-type' => MIME[File.extname(name)] || 'text/plain', 'cache-control' => 'no-cache' }, body)
      end
      Response.text("Asset not found: #{name}", 404)
    end

    def image_file(req, name)
      file = URI.decode_www_form_component(name.split('?').first) rescue name
      return Response.text('Forbidden', 403) if file.include?('..')
      src = File.join(@images_dir, file)
      return Response.text('Image not found', 404) unless File.file?(src)
      w = req.params['width']&.first.to_i
      h = req.params['height']&.first.to_i
      crop = req.params['crop']&.first
      fmt = req.params['format']&.first
      out, ofmt = ImageResizer.resize(src, w, h, crop, fmt)
      send_file(out, MIME[".#{ofmt}"])
    end

    def send_file(path, type = nil)
      return Response.text('Not found', 404) unless path && File.file?(path)
      type ||= MIME[File.extname(path).downcase] || 'application/octet-stream'
      Response.new(200, { 'content-type' => type, 'cache-control' => 'no-cache', 'last-modified' => File.mtime(path).httpdate },
                   File.binread(path))
    end

    def not_found(req, cart)
      rc = new_rc(req, cart)
      set_404(rc)
      render_response(req, rc)
    end
  end
end
