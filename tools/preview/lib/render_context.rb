# frozen_string_literal: true

module Preview
  # Liquid file system backed by the theme's snippets/ dir, with a global parse cache.
  class ThemeFileSystem
    def initialize(theme, env)
      @theme = theme
      @env = env
    end

    def rel(name) = "snippets/#{name}.liquid"

    def read_template_file(name)
      r = rel(name)
      raise Liquid::FileSystemError, "Could not find asset #{r}" unless @theme.exist?(r)
      @theme.read(r)
    end

    def cached_partial(name)
      r = rel(name)
      raise Liquid::FileSystemError, "Could not find asset #{r}" unless name.to_s.match?(%r{\A[\w\-./]+\z}) && @theme.exist?(r)
      @theme.liquid(r, @env)
    end
  end

  # Everything that is specific to one HTTP request: page resources, cart, translations, errors, drop caches.
  class RenderContext
    attr_reader :app, :store, :theme, :env, :req, :cart, :locale, :errors, :missing_translations, :internal_errors,
                :preloads, :locale_prefix
    attr_accessor :page_type, :template_name, :template_suffix, :template_directory, :main_product, :main_collection,
                  :main_page, :main_blog, :main_article, :search_drop, :predictive_drop, :recommendations_drop,
                  :current_tags, :layout, :page_title_override, :form_flash, :gift_card, :status, :template_json_override,
                  :sections_url_path, :current_form_variant_id, :resource_handle

    def initialize(app, req, cart)
      @app = app
      @store = app.store
      @theme = app.theme
      @env = app.env
      @req = req
      @cart = cart
      @locale = (req.locale || @store.shop['primary_locale'] || 'nl').to_s
      @locale_prefix = req.locale ? "/#{req.locale}" : ''
      @errors = []
      @internal_errors = []
      @missing_translations = []
      @preloads = []
      @drops = Hash.new { |h, k| h[k] = {} }
      @stack = []
      @layout = :default
      @status = 200
      @cached_partials = {}
      @fs = ThemeFileSystem.new(@theme, @env)
    end

    # ------------------------------------------------------------------ request helpers
    def path = (@sections_url_path || @req.path)

    def absolute_url(u)
      u = u.to_s
      return "http:#{u}" if u.start_with?('//')
      u.start_with?('/') ? "#{origin}#{u}" : u
    end

    # '//host' prefix for CDN-style URLs (Shopify's image_url / file_url are protocol-relative)
    def cdn_base = "//#{@req.host || '127.0.0.1'}"

    # Liquid resource URLs carry the locale prefix on a secondary-locale storefront (/en/products/x),
    # like Shopify's localized URLs. Asset/CDN/account URLs and already-prefixed paths stay as they are.
    def localize(url)
      return url if @locale_prefix.to_s.empty? || !url.is_a?(String) || !url.start_with?('/') || url.start_with?('//')
      return url if url == @locale_prefix || url.start_with?("#{@locale_prefix}/", "#{@locale_prefix}?")
      return url if url.start_with?('/cdn/', '/assets/', '/compiled_assets/', '/checkouts', '/services/')
      url == '/' ? @locale_prefix : "#{@locale_prefix}#{url}"
    end

    def unlocalize(url)
      return url if @locale_prefix.to_s.empty? || !url.is_a?(String)
      return '/' if url == @locale_prefix
      url.start_with?("#{@locale_prefix}/", "#{@locale_prefix}?") ? url[@locale_prefix.length..] : url
    end

    # selected country (localization form / cookie), falls back to the shop country
    def country_code
      cc = @req.cookies['localization'].to_s.upcase
      codes = (@store.shop['countries'] || []).map { |c| c['iso_code'].to_s.upcase }
      codes.include?(cc) ? cc : (@store.shop['country'] || 'NL')
    end
    def query_params = @req.params
    def query_param(k) = Array(@req.params[k]).first
    def host = @req.host
    def origin = "http://#{@req.host}"

    def url_with_params(set: {}, add: [], remove: nil, remove_page: false, base: nil)
      pairs = []
      @req.params.each { |k, vs| Array(vs).each { |v| pairs << [k, v] } }
      pairs.reject! { |k, _| %w[section_id sections].include?(k) }
      pairs.reject! { |k, v| remove.call(k, v) } if remove
      pairs.reject! { |k, _| k == 'page' } if remove_page
      set.each do |k, v|
        pairs.reject! { |pk, _| pk == k }
        pairs << [k, v]
      end
      add.each { |k, v| pairs << [k, v] unless pairs.include?([k, v]) }
      b = base || "#{@locale_prefix}#{path}"
      q = URI.encode_www_form(pairs)
      q.empty? ? b : "#{b}?#{q}"
    end

    def path_without_tags
      path.split('/').then { |parts| parts.size > 3 && parts[1] == 'collections' ? parts[0, 3].join('/') : path }
    end

    def iso(t) = t&.iso8601

    # ------------------------------------------------------------------ drop factories
    def product_drop(p) = @drops[:product][p.id] ||= ProductDrop.new(self, p)
    def variant_drop(v) = @drops[:variant][v.id] ||= VariantDrop.new(self, v)

    def collection_drop(c)
      @drops[:collection][c.id] ||= CollectionDrop.new(self, c, main: c == @main_collection)
    end

    def page_drop(pg) = @drops[:page][pg.id] ||= PageDrop.new(self, pg)
    def blog_drop(b) = @drops[:blog][b.id] ||= BlogDrop.new(self, b, main: b == @main_blog)
    def article_drop(a) = @drops[:article][a.id] ||= ArticleDrop.new(self, a)
    def image_drop(img, media = false) = @drops[media ? :media : :image][[img.src, img.id]] ||= ImageDrop.new(self, img, media)
    def currency_drop(code = nil) = CurrencyDrop.new(self, code || @store.shop['currency'])
    def address_drop = AddressDrop.new(self)
    def cart_drop = @cart_drop ||= CartDrop.new(self, @cart)

    def drop_for(obj)
      case obj
      when Product then product_drop(obj)
      when Collection then collection_drop(obj)
      when Page then page_drop(obj)
      when Article then article_drop(obj)
      when Blog then blog_drop(obj)
      else obj
      end
    end

    def published_locales
      (@store.shop['published_locales'] || [{ 'iso_code' => @locale, 'primary' => true }]).map { |h| ShopLocaleDrop.new(self, h) }
    end

    def current_locale_drop = published_locales.find { |l| l.iso_code == @locale } || published_locales.first

    # ------------------------------------------------------------------ variant selection
    def selected_variant_for(product)
      @selected ||= {}
      return @selected[product.id] if @selected.key?(product.id)
      v = nil
      if (vid = query_param('variant')) && !vid.empty?
        cand = @store.variant(vid)
        v = cand if cand && cand.product == product
      end
      if v.nil? && product == @main_product && (ov = query_param('option_values')) && !ov.empty?
        names = requested_option_names(product, ov)
        v = product.variants.find { |x| x.options == names } if names
      end
      @selected[product.id] = v
    end

    def requested_option_names(product, ov)
      ids = ov.split(',').map(&:to_i)
      names = product.options.map do |o|
        val = o.values.find { |x| ids.include?(x.id) }
        # Horizon shows a one-value option as plain text and leaves it out of option_values;
        # that option has only one possible value, so the variant is still unambiguous.
        val ||= o.values.first if o.values.size == 1
        val&.name
      end
      names.include?(nil) ? nil : names
    end

    def requested_fallback_variant(product)
      return nil unless product == @main_product
      ov = query_param('option_values')
      return nil if ov.nil? || ov.empty?
      ids = ov.split(',').map(&:to_i)
      wanted = product.options.map { |o| o.values.find { |x| ids.include?(x.id) }&.name }
      # closest available variant: keep as many leading selections as possible
      wanted.size.downto(0) do |n|
        cand = product.variants.find { |x| x.available? && x.options.first(n) == wanted.first(n) }
        return cand if cand
      end
      nil
    end

    # selected option values (names) for options_with_values / selected flags
    def selected_option_values(product)
      @sel_opts ||= {}
      @sel_opts[product.id] ||= begin
        v = selected_variant_for(product)
        if v
          v.options
        elsif product == @main_product && (ov = query_param('option_values')) && !ov.empty?
          ids = ov.split(',').map(&:to_i)
          fb = requested_fallback_variant(product) || product.first_available_variant || product.variants.first
          product.options.each_with_index.map { |o, i| o.values.find { |x| ids.include?(x.id) }&.name || fb&.options&.[](i) }
        else
          (product.first_available_variant || product.variants.first)&.options || []
        end
      end
    end

    def variant_matched?(v)
      return true unless @main_collection || @search_drop
      f = @main_collection ? collection_drop(@main_collection).filtering : @search_drop.filtering
      f.variant_matches?(v)
    end

    # ------------------------------------------------------------------ closest
    # Shopify resolves closest.<kind> from, innermost first: a value passed explicitly with
    # `content_for ... closest.<kind>:`, the block's/section's own resource setting of that type
    # (e.g. a hotspot block's product picker), then each ancestor block and the section, and finally
    # the template's resource. A dynamic source like "{{ closest.product }}" inside an entity's own
    # setting skips that entity (it refers to the surrounding context), which also prevents recursion.
    RESOURCE_KINDS = %w[product collection page blog article metaobject].freeze

    def closest(kind)
      @stack.reverse_each do |frame|
        return frame[:closest][kind] if frame[:closest]&.key?(kind)
        ent = frame[:block] || frame[:section]
        next unless ent
        v = entity_resource(ent, kind)
        return v if v
      end
      page_closest(kind)
    end

    def entity_resource(ent, kind)
      return nil unless RESOURCE_KINDS.include?(kind)
      @closest_busy ||= []
      return nil if @closest_busy.include?(ent.object_id)
      defs = ((ent.schema || {})['settings'] || []).select { |s| s.is_a?(Hash) && s['type'] == kind && s['id'] }
      return nil if defs.empty?
      @closest_busy << ent.object_id
      begin
        defs.each do |d|
          v = ent.settings.fetch(d['id'])
          return v if v.is_a?(BaseDrop)
        end
        nil
      ensure
        @closest_busy.delete(ent.object_id)
      end
    end

    def page_closest(kind)
      case kind
      when 'product' then @main_product && product_drop(@main_product)
      when 'collection' then @main_collection && collection_drop(@main_collection)
      when 'page' then @main_page && page_drop(@main_page)
      when 'blog' then @main_blog && blog_drop(@main_blog)
      when 'article' then @main_article && article_drop(@main_article)
      end
    end

    def current_frame = @stack.last

    # ------------------------------------------------------------------ translations
    def translations = @translations ||= @theme.translations(@locale)
    def schema_translations = @schema_translations ||= @theme.translations(@locale, schema: true)

    def translations_value(key)
      key.to_s.split('.').reduce(translations) { |h, k| h.is_a?(Hash) ? h[k] : nil }
    end

    def translate(key, vars = {})
      val = translations_value(key)
      if val.is_a?(Hash) && vars.key?('count')
        c = Util.num(vars['count'])
        val = (c.zero? && val['zero']) || (c == 1 && val['one']) || val['other'] || val['one']
      end
      unless val.is_a?(String)
        @missing_translations << key unless @missing_translations.include?(key)
        return "translation missing: #{@locale}.#{key}"
      end
      html = key.end_with?('_html') || key.include?('_html.')
      out = html ? val.dup : Util.escape_once(val)
      # Shopify leaves a placeholder that was not passed untouched ('{{ count }}'): Horizon's JS fills it later
      out.gsub(/\{\{\s*([\w.]+)\s*\}\}/) do
        k = Regexp.last_match(1)
        next Regexp.last_match(0) unless vars.key?(k)
        v = vars[k].to_s
        html ? v : Util.escape_once(v)
      end
    end

    def schema_t(str)
      return str unless str.is_a?(String) && str.start_with?('t:')
      key = str.sub('t:', '')
      v = key.split('.').reduce(schema_translations) { |h, k| h.is_a?(Hash) ? h[k] : nil }
      v.is_a?(String) ? v : str
    end

    DEFAULT_NL = {
      'availability' => 'Beschikbaarheid', 'price' => 'Prijs', 'product_type' => 'Producttype', 'vendor' => 'Merk',
      'in_stock' => 'Op voorraad', 'out_of_stock' => 'Niet op voorraad', 'previous' => 'Vorige', 'next' => 'Volgende'
    }.freeze
    DEFAULT_EN = {
      'availability' => 'Availability', 'price' => 'Price', 'product_type' => 'Product type', 'vendor' => 'Brand',
      'in_stock' => 'In stock', 'out_of_stock' => 'Out of stock', 'previous' => 'Previous', 'next' => 'Next'
    }.freeze

    def tr_default(key) = (@locale.start_with?('nl') ? DEFAULT_NL : DEFAULT_EN)[key] || key

    def collection_sort_options
      nl = @locale.start_with?('nl')
      [
        ['manual', nl ? 'Aanbevolen' : 'Featured'], ['best-selling', nl ? 'Bestverkocht' : 'Best selling'],
        ['title-ascending', nl ? 'Alfabetisch, A-Z' : 'Alphabetically, A-Z'],
        ['title-descending', nl ? 'Alfabetisch, Z-A' : 'Alphabetically, Z-A'],
        ['price-ascending', nl ? 'Prijs, laag naar hoog' : 'Price, low to high'],
        ['price-descending', nl ? 'Prijs, hoog naar laag' : 'Price, high to low'],
        ['created-ascending', nl ? 'Datum, oud naar nieuw' : 'Date, old to new'],
        ['created-descending', nl ? 'Datum, nieuw naar oud' : 'Date, new to old']
      ].map { |v, n| { 'value' => v, 'name' => n } }
    end

    def search_sort_options
      nl = @locale.start_with?('nl')
      [['relevance', nl ? 'Relevantie' : 'Relevance'], ['price-ascending', nl ? 'Prijs, laag naar hoog' : 'Price, low to high'],
       ['price-descending', nl ? 'Prijs, hoog naar laag' : 'Price, high to low']].map { |v, n| { 'value' => v, 'name' => n } }
    end

    # ------------------------------------------------------------------ settings
    def setting_defs(list)
      (list || []).each_with_object({}) { |s, h| h[s['id']] = s if s.is_a?(Hash) && s['id'] }
    end

    def theme_settings
      @theme_settings ||= SettingsDrop.new(self, @theme.current_settings, @theme.setting_definitions)
    end

    def coerce_setting(type, raw, context, defn = nil)
      if raw.is_a?(String) && raw.start_with?('t:')
        raw = schema_t(raw)
      end
      if raw.is_a?(String) && raw.include?('{{')
        raw = eval_dynamic(raw, context)
        return raw if raw.is_a?(BaseDrop) || raw.is_a?(ColorDrop) || raw.is_a?(Array)
      end
      case type
      when 'checkbox' then raw.nil? ? false : Util.to_bool(raw)
      when 'number', 'range'
        return nil if raw.nil? || raw == ''
        n = raw.is_a?(Numeric) ? raw : Util.num(raw)
        n.is_a?(Float) && n == n.to_i && !raw.to_s.include?('.') ? n.to_i : n
      when 'color' then ColorDrop.parse(raw)
      when 'color_background' then raw.nil? ? nil : raw.to_s
      when 'color_scheme'
        group = theme_settings.fetch(color_scheme_group_id)
        group.respond_to?(:liquid_method_missing) && raw ? group.liquid_method_missing(raw.to_s) : nil
      when 'color_scheme_group'
        ColorSchemeGroupDrop.new(self, raw, setting_defs(defn && defn['definition']))
      when 'color_palette' then ColorPaletteDrop.new(self, raw.is_a?(Hash) ? raw : (defn && defn['default']))
      when 'font_picker' then FontDrop.build(raw)
      when 'image_picker'
        src = shopify_file_src(raw)
        src ? image_drop(StoreImage.new(@store, { 'src' => src }, 'setting')) : nil
      when 'video' then raw.to_s.empty? ? nil : VideoDrop.new(self, raw)
      when 'video_url'
        return nil if raw.to_s.empty?
        { 'id' => raw.to_s[/(?:v=|youtu\.be\/|vimeo\.com\/)([\w-]+)/, 1], 'type' => raw.to_s.include?('vimeo') ? 'vimeo' : 'youtube' }
      when 'url' then resolve_url_setting(raw)
      when 'collection' then (c = raw.is_a?(BaseDrop) ? nil : @store.collection(raw.to_s)) && collection_drop(c)
      when 'product' then (p = @store.product(raw.to_s)) && product_drop(p)
      when 'collection_list' then Array(raw).filter_map { |h| (c = @store.collection(h.to_s)) && collection_drop(c) }
      when 'product_list' then Array(raw).filter_map { |h| (p = @store.product(h.to_s)) && product_drop(p) }
      when 'page' then (pg = @store.page(raw.to_s)) && page_drop(pg)
      when 'blog' then (b = @store.blog(raw.to_s)) && blog_drop(b)
      when 'article' then (a = @store.article_by_path(raw.to_s)) && article_drop(a)
      when 'link_list' then (m = @store.menu(raw.to_s)) && LinklistDrop.new(self, m)
      when 'metaobject' then nil
      when 'metaobject_list' then []
      when 'liquid' then render_liquid_string(raw.to_s, context)
      else
        raw
      end
    end

    def color_scheme_group_id
      @csg ||= @theme.setting_definitions.find { |_id, d| d['type'] == 'color_scheme_group' }&.first || 'color_schemes'
    end

    def shopify_file_src(raw)
      s = raw.to_s
      return nil if s.empty?
      s.sub(%r{\Ashopify://shop_images/}, '').sub(%r{\Ashopify://files/images/}, '')
    end

    def resolve_url_setting(raw)
      s = raw.to_s
      return nil if s.empty?
      # the two schema defaults Shopify allows for url settings behave like routes (localized)
      return localize(s) if ['/collections', '/collections/all'].include?(s)
      return s unless s.start_with?('shopify://')
      localize(resolve_shopify_url(s))
    end

    def resolve_shopify_url(s)
      case s
      when %r{\Ashopify://collections/all\z} then '/collections/all'
      when %r{\Ashopify://collections/(.+)} then "/collections/#{Regexp.last_match(1)}"
      when %r{\Ashopify://collections\z} then '/collections'
      when %r{\Ashopify://products/(.+)} then "/products/#{Regexp.last_match(1)}"
      when %r{\Ashopify://pages/(.+)} then "/pages/#{Regexp.last_match(1)}"
      when %r{\Ashopify://blogs/(.+)} then "/blogs/#{Regexp.last_match(1)}"
      when %r{\Ashopify://policies/(.+)} then "/policies/#{Regexp.last_match(1)}"
      when %r{\Ashopify://search} then '/search'
      when %r{\Ashopify://} then '/'
      else s
      end
    end

    def eval_dynamic(str, context)
      ctx = context || base_context
      if (m = str.match(/\A\s*\{\{\s*(.+?)\s*\}\}\s*\z/m)) && !m[1].include?('}}')
        var = Liquid::Variable.new(m[1], Liquid::ParseContext.new(environment: @env))
        var.render(ctx)
      else
        render_liquid_string(str, ctx)
      end
    rescue StandardError => e
      @errors << "Liquid error (dynamic source #{str.inspect}): #{e.message}"
      nil
    end

    def render_liquid_string(src, context)
      tpl = Liquid::Template.new(environment: @env)
      tpl.parse(src, line_numbers: true)
      ctx = context || base_context
      tpl.root.render_to_output_buffer(ctx, +'')
    rescue Liquid::Error => e
      record_error(e.to_s)
      e.to_s
    end

    # ------------------------------------------------------------------ assets
    def asset_url(name)
      rel = "assets/#{name}"
      v = @theme.exist?(rel) ? @theme.mtime(rel).to_i : (@theme.exist?("#{rel}.liquid") ? @theme.mtime("#{rel}.liquid").to_i : 0)
      "/assets/#{name}?v=#{v}"
    end

    def inline_asset(name)
      rel = "assets/#{name}"
      unless @theme.exist?(rel)
        record_error("Liquid error: Could not find asset #{rel}")
        return ''
      end
      @theme.read(rel)
    end

    def add_preload(url, as)
      @preloads << [url, as] unless @preloads.include?([url, as])
    end

    def resolve_image(input)
      case input
      when ImageDrop then input
      when ImageUrl then input.image
      when ProductDrop then input.featured_image
      when VariantDrop then input.featured_image || input.product.featured_image
      when CollectionDrop then input.featured_image
      when ArticleDrop then input.image
      when LineItemDrop then input.image
      when BrandDrop then input.logo
      when String
        return nil if input.empty?
        if input.match?(%r{\A(https?:)?//}) || input.start_with?('/')
          src = input.sub(%r{\A(?:(?:https?:)?//#{Regexp.escape(@req.host.to_s)})?/cdn/images/}, '').split('?').first
          if File.exist?(File.join(@store.images_dir, URI.decode_www_form_component(src)))
            return image_drop(StoreImage.new(@store, { 'src' => URI.decode_www_form_component(src) }, 'str'))
          end
          return image_drop(StoreImage.new(@store, { 'src' => input, 'width' => 1200, 'height' => 1200 }, 'ext'))
        end
        file = input.sub(%r{\Afiles/}, '').sub(%r{\Aproducts/}, '')
        image_drop(StoreImage.new(@store, { 'src' => file }, 'str'))
      when Hash
        src = input['src'] || input['url']
        src ? resolve_image(src.to_s) : nil
      else
        input.respond_to?(:preview_image) ? input.preview_image : nil
      end
    end

    # ------------------------------------------------------------------ json / events / structured data
    def to_json_value(input)
      v = jsonify(input)
      JSON.generate(v, quirks_mode: true).gsub('</', '<\/')
    rescue StandardError
      'null'
    end

    def jsonify(v)
      case v
      when ProductDrop, VariantDrop, CollectionDrop, CartDrop, LineItemDrop, ImageDrop, PageDrop, ArticleDrop,
           OptionValueDrop, QueryDrop, MetafieldDrop
        jsonify(v.as_json)
      when SettingsDrop then jsonify(v.to_h)
      when ColorDrop then v.to_s
      when FontDrop then v.handle
      when BaseDrop then v.to_s
      when Liquid::Drop then v.to_s
      when Hash then v.transform_keys(&:to_s).transform_values { |x| jsonify(x) }
      when Array then v.map { |x| jsonify(x) }
      when Time then v.iso8601
      when ImageUrl then v.to_s
      else v
      end
    end

    def gid(type, id) = "gid://shopify/#{type}/#{id}"

    def standard_event_payload(input, _kind, ctx)
      case input
      when ProductDrop
        v = input.selected_or_first_available_variant
        {
          'context' => ctx || 'page',
          'selectedOptions' => v ? input.p.options.each_with_index.map { |o, i| { 'name' => o.name, 'value' => v.v.options[i] } } : [],
          'product' => {
            'id' => gid('Product', input.id), 'title' => input.title, 'handle' => input.handle,
            'selectedVariant' => v ? {
              'id' => gid('ProductVariant', v.id), 'title' => v.title, 'availableForSale' => v.available,
              'price' => { 'amount' => format('%.2f', v.price / 100.0), 'currencyCode' => @store.shop['currency'] },
              'selectedOptions' => input.p.options.each_with_index.map { |o, i| { 'name' => o.name, 'value' => v.v.options[i] } }
            } : nil
          }
        }
      when CollectionDrop
        { 'collection' => { 'id' => gid('Collection', input.id), 'handle' => input.handle, 'productsCount' => input.products_count } }
      when CartDrop
        {
          'context' => ctx || 'dialog',
          'cart' => {
            'id' => gid('Cart', input.token), 'totalQuantity' => input.item_count,
            'cost' => { 'totalAmount' => { 'amount' => format('%.2f', input.total_price / 100.0), 'currencyCode' => @store.shop['currency'] } },
            'lines' => input.items.map do |li|
              { 'id' => gid('CartLine', li.key), 'quantity' => li.quantity,
                'cost' => { 'totalAmount' => { 'amount' => format('%.2f', li.final_line_price / 100.0), 'currencyCode' => @store.shop['currency'] } } }
            end,
            'discountCodes' => []
          }
        }
      else {}
      end
    end

    def structured_data(input)
      case input
      when ProductDrop
        p = input.p
        {
          '@context' => 'http://schema.org/', '@type' => p.variants.size > 1 ? 'ProductGroup' : 'Product',
          'name' => p.title, 'description' => p.description_text.strip, 'url' => "#{origin}/products/#{p.handle}",
          'image' => p.images.map { |i| absolute_url(image_drop(i).url) }, 'brand' => { '@type' => 'Brand', 'name' => p.vendor },
          (p.variants.size > 1 ? 'hasVariant' : 'offers') => if p.variants.size > 1
                                                                 p.variants.map do |v|
                                                                   { '@type' => 'Product', 'name' => "#{p.title} - #{v.title}", 'sku' => v.sku,
                                                                     'offers' => offer(p, v) }
                                                                 end
                                                               else
                                                                 offer(p, p.variants.first)
                                                               end,
          'productGroupID' => p.variants.size > 1 ? p.id.to_s : nil
        }.compact
      when ArticleDrop
        a = input.a
        {
          '@context' => 'http://schema.org/', '@type' => 'BlogPosting', 'headline' => a.title,
          'datePublished' => iso(a.published_at), 'dateModified' => iso(a.updated_at),
          'author' => { '@type' => 'Person', 'name' => a.author }, 'url' => "#{origin}#{input.url}",
          'image' => a.image ? absolute_url(image_drop(a.image).url) : nil,
          'publisher' => { '@type' => 'Organization', 'name' => @store.shop['name'] }
        }.compact
      else {}
      end
    end

    def offer(p, v)
      {
        '@type' => 'Offer', 'availability' => v.available? ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
        'price' => format('%.2f', v.price / 100.0), 'priceCurrency' => @store.shop['currency'],
        'url' => "#{origin}/products/#{p.handle}?variant=#{v.id}", 'sku' => v.sku
      }
    end

    def metafield_html(mf)
      v = mf.value
      case mf.type
      when 'rich_text_field' then rich_text_html(v)
      when 'multi_line_text_field' then Util.h(v).gsub("\n", '<br>')
      when 'url' then %(<a href="#{Util.h(v)}" class="metafield-link">#{Util.h(v)}</a>)
      when 'color' then %(<span class="metafield-color">#{v}</span>)
      when 'boolean' then %(<span class="metafield-boolean">#{v}</span>)
      else
        if v.is_a?(Array)
          %(<ul class="metafield-#{mf.type.sub('list.', '')}_array">#{v.map { |x| "<li class=\"metafield-#{mf.type.sub('list.', '')}\">#{Util.h(x)}</li>" }.join}</ul>)
        else
          %(<span class="metafield-#{mf.type}">#{Util.h(v.to_s)}</span>)
        end
      end
    end

    def rich_text_html(node)
      return Util.h(node.to_s) unless node.is_a?(Hash)
      children = (node['children'] || []).map { |c| rich_text_html(c) }.join
      case node['type']
      when 'root' then children
      when 'paragraph' then "<p>#{children}</p>"
      when 'heading' then "<h#{node['level'] || 2}>#{children}</h#{node['level'] || 2}>"
      when 'list' then node['listType'] == 'ordered' ? "<ol>#{children}</ol>" : "<ul>#{children}</ul>"
      when 'list-item' then "<li>#{children}</li>"
      when 'link' then %(<a href="#{Util.h(node['url'])}">#{children}</a>)
      when 'text'
        t = Util.h(node['value'].to_s)
        t = "<strong>#{t}</strong>" if node['bold']
        t = "<em>#{t}</em>" if node['italic']
        t
      else children
      end
    end

    # ------------------------------------------------------------------ errors
    def record_error(msg)
      @errors << msg
    end

    def unknown_props = @unknown_props ||= {}

    def note_unknown_prop(klass, name)
      key = "#{klass}.#{name}"
      unknown_props[key] = (unknown_props[key] || 0) + 1
    end

    def note_internal(e, template_name, line)
      @internal_errors << "#{template_name} line #{line}: #{e.class}: #{e.message}\n  #{Array(e.backtrace).first(6).join("\n  ")}"
    end

    # ------------------------------------------------------------------ liquid contexts
    def globals
      @globals ||= build_globals
    end

    def build_globals
      g = {
        'shop' => ShopDrop.new(self), 'settings' => theme_settings, 'cart' => cart_drop, 'customer' => nil,
        'localization' => LocalizationDrop.new(self), 'request' => RequestDrop.new(self), 'routes' => RoutesDrop.new(self),
        'template' => TemplateDrop.new(self), 'linklists' => LinklistsDrop.new(self), 'collections' => CollectionsDrop.new(self),
        'pages' => PagesDrop.new(self), 'blogs' => BlogsDrop.new(self), 'articles' => ArticlesDrop.new(self),
        'all_products' => AllProductsDrop.new(self), 'images' => ImagesDrop.new(self), 'canonical_url' => canonical_url,
        'page_title' => page_title, 'page_description' => page_description, 'page_image' => page_image, 'handle' => @resource_handle,
        'current_page' => [query_param('page').to_i, 1].max, 'current_tags' => @current_tags,
        'powered_by_link' => %(<a target="_blank" rel="nofollow" href="https://www.shopify.com?utm_campaign=poweredby&amp;utm_medium=shopify&amp;utm_source=onlinestore">#{@locale.start_with?('nl') ? 'Mogelijk gemaakt door Shopify' : 'Powered by Shopify'}</a>),
        'additional_checkout_buttons' => false, 'content_for_additional_checkout_buttons' => '',
        'metaobjects' => {}, 'scripts' => [], 'checkout' => nil, 'recommendations' => @recommendations_drop,
        'search' => @search_drop, 'predictive_search' => @predictive_drop, 'gift_card' => @gift_card
      }
      g['product'] = product_drop(@main_product) if @main_product
      g['collection'] = collection_drop(@main_collection) if @main_collection
      g['page'] = page_drop(@main_page) if @main_page
      g['blog'] = blog_drop(@main_blog) if @main_blog
      g['article'] = article_drop(@main_article) if @main_article
      g
    end

    # Shopify's canonical URL: products always at /products/<handle> (also when reached through a
    # collection), no variant/filter/sort params, ?page=N kept for paginated lists, locale prefix kept.
    def canonical_url
      path = @req.path
      path = "/products/#{@main_product.handle}" if @main_product && @page_type == 'product'
      path = '/' if @page_type == 'index'
      page = query_param('page').to_i
      qs = page > 1 && %w[collection blog search].include?(@page_type) ? "?page=#{page}" : ''
      "#{origin}#{@locale_prefix}#{path == '/' && !@locale_prefix.to_s.empty? ? '' : path}#{qs}"
    end

    # page_image: product featured media, collection image, article image, else the shop's social
    # sharing image (Online Store > Preferences; fixture shop.social_sharing_image).
    def page_image
      img = if @main_product then @main_product.images.first
            elsif @main_collection then @main_collection.image
            elsif @main_article then @main_article.image
            end
      if img.nil? && (ss = @store.shop['social_sharing_image'])
        img = (@social_image ||= StoreImage.new(@store, ss, 'shop:social'))
      end
      img && image_drop(img)
    end

    def page_title
      return @page_title_override if @page_title_override
      if @main_product then @main_product.seo['title'] || @main_product.title
      elsif @main_collection then @main_collection.seo['title'] || @main_collection.title
      elsif @main_article then @main_article.seo['title'] || @main_article.title
      elsif @main_blog then @main_blog.title
      elsif @main_page then @main_page.seo['title'] || @main_page.title
      elsif @page_type == 'search' then @locale.start_with?('nl') ? 'Zoeken' : 'Search'
      elsif @page_type == 'cart' then @locale.start_with?('nl') ? 'Je winkelwagen' : 'Your cart'
      elsif @page_type == '404' then @locale.start_with?('nl') ? '404 Pagina niet gevonden' : '404 Not Found'
      elsif @page_type == 'list-collections' then @locale.start_with?('nl') ? 'Collecties' : 'Collections'
      else @store.shop['name']
      end
    end

    def page_description
      d = if @main_product then @main_product.seo['description'] || @main_product.description_text
          elsif @main_collection then @main_collection.seo['description'] || Util.strip_html(@main_collection.body_html)
          elsif @main_article then Util.strip_html(@main_article.summary_html.to_s.empty? ? @main_article.body_html : @main_article.summary_html)
          elsif @main_page then Util.strip_html(@main_page.body_html)
          else @store.shop['description']
          end
      d = d.to_s.strip.gsub(/\s+/, ' ')
      d.empty? ? nil : d[0, 320]
    end

    def base_context(static = {}, scope = {})
      ctx = Liquid::Context.build(
        environment: @env,
        environments: [{}], # increment/decrement counters live in environments.first
        outer_scope: scope,
        registers: { rc: self, file_system: @fs, cached_partials: @cached_partials },
        static_environments: [static, globals]
      )
      ctx.strict_filters = true
      ctx
    end

    def closest_drop = @closest_drop ||= ClosestDrop.new(self)

    def with_frame(frame)
      @stack.push(frame)
      yield
    ensure
      @stack.pop
    end

    def frame_closest(overrides)
      return nil if overrides.nil? || overrides.empty?
      overrides
    end

    # ------------------------------------------------------------------ blocks
    def block_drop(bid, data, section, parent)
      schema = @theme.block_file?(data['type']) ? @theme.block_schema(data['type']) : section_block_schema(section, data['type'])
      BlockDrop.new(self, bid, data, section, parent, schema)
    end

    def section_block_schema(section, type)
      return {} unless section
      (section.schema['blocks'] || []).find { |b| b['type'] == type } || {}
    end

    # content_for 'blocks'
    def render_blocks(context, closest_overrides = {})
      frame = current_frame
      return '' unless frame
      parent = frame[:block] || frame[:section]
      out = +''
      parent.blocks.each do |b|
        next if b.type.to_s.start_with?('@')
        out << render_block_drop(b, closest_overrides, {}, context)
      end
      out
    end

    # content_for 'block', type:, id:
    def render_static_block(type, id, closest_overrides, vars, context)
      frame = current_frame
      return '' unless frame
      parent = frame[:block] || frame[:section]
      data = parent.blocks_data[id.to_s]
      return '' if data && data['disabled'] # a static block the merchant hid in the theme editor
      data = data ? data.merge('type' => type, 'static' => true) : { 'type' => type, 'static' => true, 'settings' => {}, 'blocks' => {} }
      drop = block_drop(id.to_s, data, frame[:section], frame[:block])
      render_block_drop(drop, closest_overrides, vars, context)
    end

    def render_block_drop(drop, closest_overrides, vars, _context)
      type = drop.type.to_s
      rel = "blocks/#{type}.liquid"
      unless @theme.exist?(rel)
        return '' unless drop.static? || section_block_schema(drop.section, type).empty?
        msg = "Liquid error: Error in tag 'content_for' - '#{type}' is not a valid block type"
        record_error(msg)
        return msg
      end
      begin
        tpl = @theme.liquid(rel, @env)
      rescue Liquid::Error => e
        e.template_name ||= rel
        msg = e.to_s
        record_error(msg)
        return msg
      end
      frame = { section: current_frame&.dig(:section), block: drop, closest: closest_overrides }
      out = +''
      with_frame(frame) do
        ctx = base_context({ 'section' => frame[:section], 'block' => drop, 'closest' => closest_drop }, vars)
        ctx.template_name = rel
        tpl.root.render_to_output_buffer(ctx, out)
      end
      # Theme blocks get a wrapper element unless their schema sets "tag": null (Shopify behaviour).
      schema = drop.schema || {}
      return out if schema.key?('tag') && schema['tag'].nil?
      tag = schema['tag'].is_a?(String) && !schema['tag'].empty? ? schema['tag'] : 'div'
      %(<#{tag} id="shopify-block-#{drop.id}" class="shopify-block">#{out}</#{tag}>)
    end

    # Shopify scopes theme block ids per section (e.g. "AbmFweS9TQ0xqQjNIc__text_9iKfQd") so the same JSON key
    # in two sections never collides in CSS/DOM ids.
    def theme_block_id(section, key)
      return key unless section
      prefix = [Digest::SHA1.digest(section.sid.to_s)].pack('m0').gsub(/[^A-Za-z0-9]/, '')[0, 17]
      "A#{prefix}__#{key}"
    end

    # ------------------------------------------------------------------ sections
    def template_id(name) = Util.stable_id("template:#{name}", 10_000_000_000_000)
    def group_id(name) = Util.stable_id("group:#{name}", 10_000_000_000_000)

    def render_section(sid, type, data, index: nil, location: 'template', group: nil, wrapper: true)
      rel = "sections/#{type}.liquid"
      unless @theme.exist?(rel)
        msg = "Liquid error: Error in tag 'section' - '#{type}' is not a valid section type"
        record_error(msg)
        return msg
      end
      schema = @theme.section_schema(type)
      drop = SectionDrop.new(self, sid, type, data, schema, index: index, location: location)
      out = +''
      begin
        tpl = @theme.liquid(rel, @env)
        with_frame({ section: drop, block: nil, closest: nil }) do
          ctx = base_context({ 'section' => drop, 'closest' => closest_drop })
          ctx.template_name = rel
          tpl.root.render_to_output_buffer(ctx, out)
        end
      rescue Liquid::Error => e
        e.template_name ||= rel
        out = e.to_s
        record_error(out)
      end
      return out unless wrapper
      tag = schema.key?('tag') && schema['tag'] ? schema['tag'] : 'div'
      classes = ['shopify-section', group ? "shopify-section-group-#{group}" : nil, schema['class']].compact.join(' ')
      %(<#{tag} id="shopify-section-#{sid}" class="#{classes}">#{out}</#{tag}>\n)
    end

    def section_group(name)
      rel = "sections/#{name}.json"
      @theme.exist?(rel) ? @theme.json(rel) : nil
    end

    def render_section_group(name)
      data = section_group(name)
      unless data
        msg = "Liquid error: Error in tag 'sections' - '#{name}' is not a valid section group"
        record_error(msg)
        return msg
      end
      gid = group_id(name)
      out = +''
      idx = 0
      (data['order'] || data['sections'].keys).each do |key|
        sec = data['sections'][key]
        next unless sec
        next if sec['disabled']
        idx += 1
        out << render_section("sections--#{gid}__#{key}", sec['type'], sec, index: idx, location: data['type'] || name.sub('-group', ''), group: name)
      end
      out
    end

    def static_section_data(type)
      cur = @theme.current_raw
      (cur['sections'] || {})[type] || static_default(type)
    end

    def static_default(type)
      schema = @theme.section_schema(type)
      d = schema['default'] || {}
      blocks = {}
      order = []
      (d['blocks'] || []).each_with_index do |b, i|
        id = "#{b['type']}_#{i}"
        blocks[id] = { 'type' => b['type'], 'settings' => b['settings'] || {} }
        order << id
      end
      { 'type' => type, 'settings' => d['settings'] || {}, 'blocks' => blocks, 'block_order' => order }
    end

    def render_static_section(type)
      render_section(type, type, static_section_data(type), location: 'static')
    end

    # ------------------------------------------------------------------ templates & layout
    def template_rel
      base = @template_directory ? "#{@template_directory}/#{@template_name}" : @template_name
      cands = []
      cands << "templates/#{base}.#{@template_suffix}.json" << "templates/#{base}.#{@template_suffix}.liquid" if @template_suffix
      cands << "templates/#{base}.json" << "templates/#{base}.liquid"
      found = cands.find { |c| @theme.exist?(c) }
      @template_suffix = nil if found && @template_suffix && !found.include?(".#{@template_suffix}.")
      found
    end

    def template_json
      return @template_json_override if @template_json_override
      rel = template_rel
      rel&.end_with?('.json') ? @theme.json(rel) : nil
    end

    def render_template
      rel = template_rel
      unless rel
        msg = "Liquid error: template #{@template_name} not found"
        record_error(msg)
        return msg
      end
      if rel.end_with?('.json')
        data = @theme.json(rel)
        @layout = data.key?('layout') ? (data['layout'] == false ? nil : data['layout']) : :default
        tid = template_id(@template_name)
        out = +''
        idx = 0
        (data['order'] || data['sections'].keys).each do |key|
          sec = data['sections'][key]
          next unless sec
          next if sec['disabled']
          idx += 1
          out << render_section("template--#{tid}__#{key}", sec['type'], sec, index: idx, location: 'template')
        end
        if (w = data['wrapper'])
          out = wrap(w, out)
        end
        out
      else
        tpl = @theme.liquid(rel, @env)
        out = +''
        ctx = base_context({ 'closest' => closest_drop })
        ctx.template_name = rel
        tpl.root.render_to_output_buffer(ctx, out)
        out
      end
    rescue Liquid::Error => e
      e.template_name ||= rel
      record_error(e.to_s)
      e.to_s
    end

    def wrap(spec, inner)
      m = spec.match(/\A(\w+)((?:[#.][\w-]+)*)((?:\[[^\]]+\])*)\z/)
      return inner unless m
      tag = m[1]
      id = m[2].scan(/#([\w-]+)/).flatten.first
      classes = m[2].scan(/\.([\w-]+)/).flatten
      attrs = m[3].scan(/\[([^=\]]+)=?([^\]]*)\]/)
      a = +''
      a << %( id="#{id}") if id
      a << %( class="#{classes.join(' ')}") unless classes.empty?
      attrs.each { |k, v| a << %( #{k}="#{v}") }
      "<#{tag}#{a}>#{inner}</#{tag}>"
    end

    HEADER_TOKEN = '<!--PREVIEW_CONTENT_FOR_HEADER-->'

    def render_page
      content = render_template
      layout = @layout == :default ? 'theme' : @layout
      html = if layout.nil?
               content
             else
               render_layout(layout, content)
             end
      html.sub(HEADER_TOKEN) { content_for_header }
    end

    def render_layout(name, content)
      rel = "layout/#{name}.liquid"
      unless @theme.exist?(rel)
        record_error("Liquid error: layout #{rel} not found")
        return content
      end
      tpl = @theme.liquid(rel, @env)
      out = +''
      ctx = base_context({ 'content_for_layout' => content, 'content_for_header' => HEADER_TOKEN,
                           'content_for_index' => content_for_index, 'closest' => closest_drop })
      ctx.template_name = rel
      tpl.root.render_to_output_buffer(ctx, out)
      out
    rescue Liquid::Error => e
      e.template_name ||= rel
      record_error(e.to_s)
      e.to_s + content
    end

    def content_for_index
      cur = @theme.current_raw
      ids = cur['content_for_index'] || []
      ids.map { |id| render_section(id, (cur['sections'] || {}).dig(id, 'type') || id, (cur['sections'] || {})[id] || {}) }.join
    end

    def content_for_header
      app.content_for_header(self)
    end
  end
end
