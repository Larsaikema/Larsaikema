# frozen_string_literal: true

module Preview
  # Shopify-specific Liquid filters. Core filters (where, map, sum, ...) come from Liquid 5 StandardFilters.
  module ShopifyFilters
    DEFAULT_SRCSET_WIDTHS = [352, 832, 1200, 1920, 2560, 3840].freeze
    MONTHS_NL = %w[januari februari maart april mei juni juli augustus september oktober november december].freeze
    MONTHS_EN = %w[January February March April May June July August September October November December].freeze
    MONTHS_NL_ABBR = %w[jan feb mrt apr mei jun jul aug sep okt nov dec].freeze
    DAYS_NL = %w[zondag maandag dinsdag woensdag donderdag vrijdag zaterdag].freeze
    DAYS_EN = %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday].freeze

    def rc = @context.registers[:rc]
    private :rc

    # Shopify's HTML tag filters return HTML-safe strings that `escape` leaves alone: Horizon pipes
    # `image_tag | escape` for its gallery thumbnails (slideshow-controls, zoom dialog) and they show as images.
    class SafeHtml < String; end

    def escape(input)
      return input if input.is_a?(SafeHtml)
      super
    end

    # ---------------------------------------------------------------- money
    def money(input)
      return '' if input.nil? || input == ''
      Util.money_format_apply(Util.num(input), rc.store.shop['money_format'])
    end

    def money_with_currency(input)
      return '' if input.nil? || input == ''
      Util.money_format_apply(Util.num(input), rc.store.shop['money_with_currency_format'])
    end

    def money_without_currency(input)
      return '' if input.nil? || input == ''
      fmt = rc.store.shop['money_format'].to_s[/\{\{\s*\w+\s*\}\}/] || '{{amount}}'
      Util.money_format_apply(Util.num(input), fmt)
    end

    def money_without_trailing_zeros(input)
      return '' if input.nil? || input == ''
      s = money(input)
      s.sub(/[.,]00(?=\D*\z)/, '')
    end

    # Decimal amount for data attributes (e.g. "249.00")
    def money_amount(input)
      return '' if input.nil? || input == ''
      format('%.2f', Util.num(input) / 100.0)
    end

    # ---------------------------------------------------------------- translations
    def t(key, *args)
      vars = args.last.is_a?(Hash) ? args.last : {}
      rc.translate(key.to_s, vars)
    end
    alias translate t

    # ---------------------------------------------------------------- json
    def json(input)
      rc.to_json_value(input)
    end

    # ---------------------------------------------------------------- strings / urls
    def handleize(input) = Util.handleize(input)
    alias handle handleize

    def camelize(input)
      input.to_s.split(/[-_\s]+/).map(&:capitalize).join
    end

    def url_escape(input)
      URI::DEFAULT_PARSER.escape(input.to_s).gsub('+', '%2B') rescue input.to_s
    end

    def url_param_escape(input)
      url_escape(input).gsub('&', '%26')
    end

    def pluralize(input, singular, plural)
      Util.num(input) == 1 ? singular : plural
    end

    def highlight(input, terms)
      words = terms.to_s.split.map { |w| Regexp.escape(w) }
      return input.to_s if words.empty?
      input.to_s.gsub(/(#{words.join('|')})(?![^<]*>)/i) { %(<strong class="highlight">#{Regexp.last_match(1)}</strong>) }
    end

    def link_to(input, url, title = nil)
      %(<a href="#{Util.h(url)}"#{title ? %( title="#{Util.h(title)}") : ''}>#{input}</a>)
    end

    # extra arguments (e.g. an HTML attribute hash) are tolerated, like Shopify
    def link_to_vendor(input, *_rest) = link_to(input, url_for_vendor(input), input)
    def link_to_type(input, *_rest) = link_to(input, url_for_type(input), input)
    def url_for_vendor(input, *_rest) = rc.localize("/collections/vendors?q=#{Util.url_encode(input)}")
    def url_for_type(input, *_rest) = rc.localize("/collections/types?q=#{Util.url_encode(input)}")

    # Shopify: links to the current collection (or blog) filtered by the tag; outside a collection the
    # 'all' collection: <a href="/collections/all/ab" title="Show products matching tag ab">
    def link_to_tag(input, tag)
      t = Util.handleize(tag)
      if rc.main_blog && !rc.main_collection
        url = rc.localize("/blogs/#{rc.main_blog.handle}/tagged/#{t}")
        return %(<a href="#{Util.h(url)}" title="Show articles tagged #{Util.h(tag)}">#{input}</a>)
      end
      handle = rc.main_collection ? rc.main_collection.handle : 'all'
      url = rc.localize("/collections/#{handle}/#{t}")
      %(<a href="#{Util.h(url)}" title="Show products matching tag #{Util.h(tag)}">#{input}</a>)
    end

    def link_to_add_tag(input, tag)
      tags = (rc.current_tags || []) | [Util.handleize(tag)]
      %(<a href="#{rc.localize("#{rc.path_without_tags}/#{tags.join('+')}")}" title="Show products matching tag #{Util.h(tag)}">#{input}</a>)
    end

    def link_to_remove_tag(input, tag)
      tags = (rc.current_tags || []) - [Util.handleize(tag)]
      url = rc.localize(tags.empty? ? rc.path_without_tags : "#{rc.path_without_tags}/#{tags.join('+')}")
      %(<a href="#{url}" title="Remove tag #{Util.h(tag)}">#{input}</a>)
    end

    def highlight_active_tag(input, css_class = 'active')
      (rc.current_tags || []).include?(Util.handleize(input)) ? %(<span class="#{css_class}">#{input}</span>) : input.to_s
    end

    def within(url, collection)
      return url if collection.nil?
      handle = collection.respond_to?(:handle) ? collection.handle : collection.to_s
      rc.localize("/collections/#{handle}#{rc.unlocalize(url.to_s)}")
    end

    def sort_by(input, value)
      rc.url_with_params(set: { 'sort_by' => value.to_s }, base: input.to_s)
    end

    def customer_login_link(input) = %(<a href="/account/login" id="customer_login_link">#{input}</a>)
    def customer_logout_link(input) = %(<a href="/account/logout" id="customer_logout_link">#{input}</a>)
    def customer_register_link(input) = %(<a href="/account/register" id="customer_register_link">#{input}</a>)

    # ---------------------------------------------------------------- assets
    def asset_url(input)
      rc.asset_url(input.to_s)
    end

    def asset_img_url(input, size = nil, *_rest)
      w = size_width(size)
      url = asset_url(input)
      w ? "#{url}&width=#{w}" : url
    end

    def file_url(input) = "#{rc.cdn_base}/cdn/images/#{input}"
    def file_img_url(input, size = nil, *_rest) = (w = size_width(size)) ? "#{file_url(input)}?width=#{w}" : file_url(input)
    def shopify_asset_url(input) = "/cdn/shopifycloud/shopify/assets/#{input}"
    def global_asset_url(input) = "/cdn/shopifycloud/global/#{input}"

    def inline_asset_content(input)
      rc.inline_asset(input.to_s)
    end

    def stylesheet_tag(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      media = opts['media'] ? %( media="#{Util.h(opts['media'])}") : ' media="all"'
      rc.add_preload(input.to_s, 'style') if opts['preload']
      %(<link href="#{Util.h(input)}" rel="stylesheet" type="text/css"#{media} />)
    end

    def script_tag(input)
      %(<script src="#{Util.h(input)}" type="text/javascript"></script>)
    end

    def preload_tag(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      as = opts['as'] || (input.to_s.include?('.css') ? 'style' : 'script')
      attrs = opts.reject { |k, _| k == 'as' }.map { |k, v| %( #{k}="#{Util.h(v)}") }.join
      %(<link href="#{Util.h(input)}" as="#{as}" rel="preload"#{attrs}>)
    end

    # ---------------------------------------------------------------- images
    def image_url(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      img = rc.resolve_image(input)
      return nil if img.nil?
      w = opts['width']
      h = opts['height']
      ImageUrl.build(img, width: w && w.to_i.positive? ? w : nil, height: h && h.to_i.positive? ? h : nil,
                          crop: opts['crop'], format: opts['format'], pad_color: opts['pad_color'])
    end

    def img_url(input, size = nil, opts = {})
      opts = {} unless opts.is_a?(Hash)
      img = rc.resolve_image(input)
      return '' if img.nil?
      w, h = parse_size(size)
      ImageUrl.build(img, width: w, height: h, crop: opts['crop'], format: opts['format']).to_s
    end

    def product_img_url(input, size = nil) = img_url(input, size)
    def collection_img_url(input, size = nil) = img_url(input, size)
    def article_img_url(input, size = nil) = img_url(input, size)

    def img_tag(input, alt = '', klass = '')
      %(<img src="#{Util.h(input)}" alt="#{Util.h(alt)}" class="#{Util.h(klass)}" />)
    end

    def image_tag(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      url = input.is_a?(ImageUrl) ? input : nil
      unless url
        img = rc.resolve_image(input)
        return '' unless img
        url = ImageUrl.build(img)
      end
      img = url.image
      orig_w = img.respond_to?(:width) ? img.width.to_i : 0
      orig_h = img.respond_to?(:height) ? img.height.to_i : 0
      ratio = orig_h.positive? ? orig_w.to_f / orig_h : 1.0
      req_w = url.width
      req_h = url.height
      if req_w && req_h
        if url.crop
          disp_w = req_w
          disp_h = req_h
        else
          scale = [req_w.to_f / orig_w, req_h.to_f / orig_h, 1.0].min
          disp_w = (orig_w * scale).round
          disp_h = (orig_h * scale).round
        end
      elsif req_w
        disp_w = orig_w.positive? ? [req_w, orig_w].min : req_w
        disp_h = (disp_w / ratio).round
      elsif req_h
        disp_h = orig_h.positive? ? [req_h, orig_h].min : req_h
        disp_w = (disp_h * ratio).round
      else
        disp_w = orig_w
        disp_h = orig_h
      end
      max_w = req_w || orig_w
      max_w = [max_w, orig_w].min if orig_w.positive?

      attrs = []
      src = url.to_s
      attrs << ['src', src]
      alt = opts.key?('alt') ? opts['alt'] : (img.respond_to?(:alt) ? img.alt : '')
      attrs << ['alt', alt.to_s]
      unless opts.key?('srcset') && opts['srcset'].nil?
        widths = if opts['widths']
                   opts['widths'].to_s.split(',').map { |x| x.strip.to_i }.select(&:positive?)
                 else
                   DEFAULT_SRCSET_WIDTHS.select { |x| x < max_w } + [max_w]
                 end
        widths = widths.select { |x| orig_w.zero? || x <= orig_w }.uniq.sort
        srcset = widths.map { |x| "#{url.with_width(x)} #{x}w" }.join(', ')
        srcset = opts['srcset'].to_s if opts['srcset'].is_a?(String)
        attrs << ['srcset', srcset] unless srcset.empty?
      end
      attrs << ['width', opts.key?('width') ? opts['width'] : disp_w] unless opts.key?('width') && opts['width'].nil?
      attrs << ['height', opts.key?('height') ? opts['height'] : disp_h] unless opts.key?('height') && opts['height'].nil?
      rc.add_preload(src, 'image') if opts['preload']
      skip = %w[alt srcset width height widths preload src]
      opts.each do |k, v|
        next if skip.include?(k)
        next if v.nil?
        next if v == false
        attrs << [k, v]
      end
      html = attrs.map { |k, v| v == true ? k : %(#{k}="#{Util.escape_once(v)}") }.join(' ')
      SafeHtml.new("<img #{html}>")
    end

    def placeholder_svg_tag(input, klass = nil)
      Placeholders.svg(input, klass)
    end

    def parse_size(size)
      s = size.to_s
      named = { 'pico' => 16, 'icon' => 32, 'thumb' => 50, 'small' => 100, 'compact' => 160, 'medium' => 240,
                'large' => 480, 'grande' => 600, 'original' => nil, 'master' => nil }
      return [named[s], named[s]] if named.key?(s)
      m = s.match(/\A(\d*)x(\d*)\z/)
      return [nil, nil] unless m
      [m[1].empty? ? nil : m[1].to_i, m[2].empty? ? nil : m[2].to_i]
    end

    def size_width(size)
      parse_size(size).first
    end

    # ---------------------------------------------------------------- media
    def video_tag(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      attrs = opts.map { |k, v| v == true ? k : %(#{k}="#{Util.h(v)}") }.join(' ')
      %(<video #{attrs} playsinline="playsinline"></video>)
    end

    def external_video_url(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      host = input.respond_to?(:host) ? input.host : 'youtube'
      id = input.respond_to?(:external_id) ? input.external_id : input.to_s
      q = opts.map { |k, v| "#{k}=#{v}" }.join('&')
      base = host.to_s.include?('vimeo') ? "https://player.vimeo.com/video/#{id}" : "https://www.youtube.com/embed/#{id}"
      q.empty? ? base : "#{base}?#{q}"
    end

    def external_video_tag(input, opts = {})
      opts = {} unless opts.is_a?(Hash)
      attrs = opts.map { |k, v| %(#{k}="#{Util.h(v)}") }.join(' ')
      %(<iframe src="about:blank" #{attrs} title="video" allow="autoplay; encrypted-media" allowfullscreen></iframe>)
    end

    def media_tag(input, opts = {})
      return image_tag(input, opts) if input.is_a?(ImageDrop)
      ''
    end

    def model_viewer_tag(_input, _opts = {}) = ''

    # ---------------------------------------------------------------- colors
    def color_drop(input) = ColorDrop.parse(input.is_a?(ColorDrop) ? input : input.to_s)

    def color_to_rgb(input)
      c = color_drop(input) or return ''
      c.a < 1 ? "rgba(#{c.r}, #{c.g}, #{c.b}, #{c.fmt_a})" : "rgb(#{c.r}, #{c.g}, #{c.b})"
    end

    def color_to_hsl(input)
      c = color_drop(input) or return ''
      h, s, l = Colors.rgb_to_hsl(c.r, c.g, c.b).map(&:round)
      c.a < 1 ? "hsla(#{h}, #{s}%, #{l}%, #{c.fmt_a})" : "hsl(#{h}, #{s}%, #{l}%)"
    end

    def color_to_hex(input)
      c = color_drop(input) or return ''
      format('#%02x%02x%02x', c.r, c.g, c.b)
    end

    def color_extract(input, component)
      c = color_drop(input) or return ''
      h, s, l = Colors.rgb_to_hsl(c.r, c.g, c.b)
      { 'red' => c.r, 'green' => c.g, 'blue' => c.b, 'alpha' => c.a, 'hue' => h.round, 'saturation' => s.round,
        'lightness' => l.round }[component.to_s]
    end

    def color_modify(input, prop, value)
      c = color_drop(input) or return ''
      v = value.to_f
      h, s, l = Colors.rgb_to_hsl(c.r, c.g, c.b)
      out = case prop.to_s
            when 'red' then ColorDrop.new(v, c.g, c.b, c.a)
            when 'green' then ColorDrop.new(c.r, v, c.b, c.a)
            when 'blue' then ColorDrop.new(c.r, c.g, v, c.a)
            when 'alpha' then ColorDrop.new(c.r, c.g, c.b, v)
            when 'hue' then Colors.from_hsl(v, s, l, c.a)
            when 'saturation' then Colors.from_hsl(h, v, l, c.a)
            when 'lightness' then Colors.from_hsl(h, s, v, c.a)
            else c
            end
      return out if input.is_a?(ColorDrop)
      if prop.to_s == 'alpha' || c.a < 1
        "rgba(#{out.r}, #{out.g}, #{out.b}, #{out.fmt_a})"
      else
        Colors.output(out, input)
      end
    end

    def adjust_lightness(input, delta)
      c = color_drop(input) or return ''
      h, s, l = Colors.rgb_to_hsl(c.r, c.g, c.b)
      out = Colors.from_hsl(h, s, (l + delta).clamp(0, 100), c.a)
      input.is_a?(ColorDrop) ? out : Colors.output(out, input)
    end

    def color_lighten(input, amount) = adjust_lightness(input, amount.to_f)
    def color_darken(input, amount) = adjust_lightness(input, -amount.to_f)

    def adjust_saturation(input, delta)
      c = color_drop(input) or return ''
      h, s, l = Colors.rgb_to_hsl(c.r, c.g, c.b)
      out = Colors.from_hsl(h, (s + delta).clamp(0, 100), l, c.a)
      input.is_a?(ColorDrop) ? out : Colors.output(out, input)
    end

    def color_saturate(input, amount) = adjust_saturation(input, amount.to_f)
    def color_desaturate(input, amount) = adjust_saturation(input, -amount.to_f)

    def color_brightness(input)
      c = color_drop(input) or return 0
      Colors.brightness(c).round(2)
    end

    def color_contrast(input, other)
      a = color_drop(input)
      b = color_drop(other)
      return 0 unless a && b
      Colors.contrast(a, b)
    end

    def color_difference(input, other)
      a = color_drop(input)
      b = color_drop(other)
      return 0 unless a && b
      ((a.r - b.r).abs + (a.g - b.g).abs + (a.b - b.b).abs)
    end

    def brightness_difference(input, other)
      a = color_drop(input)
      b = color_drop(other)
      return 0 unless a && b
      (Colors.brightness(a) - Colors.brightness(b)).abs.round
    end

    def color_mix(input, other, weight)
      a = color_drop(input)
      b = color_drop(other)
      return '' unless a && b
      w = weight.to_f / 100.0
      mix = ColorDrop.new((a.r * w) + (b.r * (1 - w)), (a.g * w) + (b.g * (1 - w)), (a.b * w) + (b.b * (1 - w)),
                          (a.a * w) + (b.a * (1 - w)))
      input.is_a?(ColorDrop) ? mix : Colors.output(mix, input)
    end

    # ---------------------------------------------------------------- fonts
    def font_face(input, opts = {})
      f = FontDrop.build(input)
      return '' unless f
      opts = {} unless opts.is_a?(Hash)
      f.face(opts['font_display'])
    end

    def font_url(input, _format = nil)
      f = FontDrop.build(input)
      f&.url.to_s
    end

    def font_modify(input, prop, value)
      f = FontDrop.build(input)
      f&.modify(prop, value)
    end

    # ---------------------------------------------------------------- dates
    def date(input, format = nil, opts = nil)
      if format.is_a?(Hash)
        opts = format
        format = nil
      end
      opts ||= {}
      t = to_time(input)
      return input if t.nil?
      # Shopify: a strftime string is formatted as-is (English day/month names); only `format: 'name'`
      # (theme locale date_formats / Shopify's localized defaults) and time_tag output localized names.
      return t.strftime(format.to_s) if format
      named = named_date_format(opts['format'])
      named ? strftime_l(t, named) : t.strftime('%a, %b %d, %y')
    end

    def time_tag(input, format = nil, opts = nil)
      if format.is_a?(Hash)
        opts = format
        format = nil
      end
      opts ||= {}
      t = to_time(input)
      return '' unless t
      fmt = format || named_date_format(opts['format'] || 'default')
      dt = opts['datetime'] ? strftime_l(t, opts['datetime']) : t.utc.strftime('%Y-%m-%dT%H:%M:%SZ')
      %(<time datetime="#{dt}">#{strftime_l(t, fmt)}</time>)
    end

    def named_date_format(name)
      return nil if name.nil?
      nl = rc.locale.start_with?('nl')
      loc = rc.translations_value("date_formats.#{name}")
      return loc if loc.is_a?(String)
      if nl
        { 'abbreviated_date' => '%-d %b %Y', 'basic' => '%d-%m-%Y', 'date' => '%-d %B %Y',
          'date_at_time' => '%-d %B %Y om %H:%M', 'default' => '%a %-d %b %Y om %H:%M %z',
          'on_date' => 'op %-d %B %Y', 'short' => '%-d %b', 'month_day_year' => '%-d %B %Y' }[name.to_s]
      else
        { 'abbreviated_date' => '%b %d, %Y', 'basic' => '%m/%d/%Y', 'date' => '%B %d, %Y',
          'date_at_time' => '%B %d, %Y at %-l:%M %P', 'default' => '%a, %b %d, %Y at %-l:%M %P %z',
          'on_date' => 'on %b %d, %Y', 'short' => '%d %b', 'month_day_year' => '%B %d, %Y' }[name.to_s]
      end
    end

    def to_time(input)
      case input
      when Time then input
      when Date then input.to_time
      when Numeric then Time.at(input)
      when nil then nil
      else
        s = input.to_s
        return Time.now if %w[now today].include?(s)
        return Time.at(s.to_i) if s.match?(/\A\d+\z/)
        Time.parse(s) rescue nil
      end
    end

    def strftime_l(t, fmt)
      nl = rc.locale.start_with?('nl')
      months = nl ? MONTHS_NL : MONTHS_EN
      days = nl ? DAYS_NL : DAYS_EN
      abbr = nl ? MONTHS_NL_ABBR[t.month - 1] : months[t.month - 1][0, 3]
      f = fmt.gsub('%B', months[t.month - 1]).gsub('%b', abbr)
             .gsub('%A', days[t.wday]).gsub('%a', days[t.wday][0, nl ? 2 : 3])
      t.strftime(f)
    end

    # ---------------------------------------------------------------- misc shopify
    def default_pagination(paginate, opts = {})
      return '' unless paginate.respond_to?(:parts)
      out = []
      prev = paginate.previous
      nxt = paginate.next
      out << %(<span class="prev"><a href="#{prev['url']}">&laquo; #{rc.tr_default('previous')}</a></span>) if prev
      paginate.parts.each do |part|
        out << if part['is_link']
                 %(<span class="page"><a href="#{part['url']}">#{part['title']}</a></span>)
               elsif part['title'].to_s == paginate.current_page.to_s
                 %(<span class="page current">#{part['title']}</span>)
               else
                 %(<span class="deco">#{part['title']}</span>)
               end
      end
      out << %(<span class="next"><a href="#{nxt['url']}">#{rc.tr_default('next')} &raquo;</a></span>) if nxt
      out.join(' ')
    end

    def weight_with_unit(grams, unit = nil)
      unit ||= 'kg'
      g = Util.num(grams).to_f
      v = case unit.to_s
          when 'kg' then g / 1000.0
          when 'lb' then g / 453.59237
          when 'oz' then g / 28.349523125
          else g
          end
      s = (v == v.round ? v.round.to_s : v.round(2).to_s)
      s = s.tr('.', ',') if rc.locale.start_with?('nl')
      "#{s} #{unit}"
    end

    def format_address(input)
      a = input.respond_to?(:address1) ? input : nil
      return '' unless a
      lines = [a.company, a.street, [a.zip, a.city].compact.join(' '), a.country].compact.reject(&:empty?)
      %(<p>#{lines.map { |l| Util.h(l) }.join('<br>')}</p>)
    end

    def format_code(input)
      input.to_s.scan(/.{1,4}/).join(' ')
    end

    def md5(input) = Digest::MD5.hexdigest(input.to_s)
    def sha1(input) = Digest::SHA1.hexdigest(input.to_s)
    def sha256(input) = Digest::SHA256.hexdigest(input.to_s)
    def hmac_sha1(input, secret) = OpenSSL::HMAC.hexdigest('SHA1', secret.to_s, input.to_s)
    def hmac_sha256(input, secret) = OpenSSL::HMAC.hexdigest('SHA256', secret.to_s, input.to_s)

    def item_count_for_variant(cart, variant_id)
      c = cart.respond_to?(:cart) ? cart.cart : nil
      return 0 unless c
      c.lines.select { |l| l.variant_id.to_s == variant_id.to_s }.sum(&:quantity)
    end

    def line_items_for(cart, obj)
      return [] unless cart.respond_to?(:items)
      cart.items.select do |li|
        case obj
        when ProductDrop then li.product_id == obj.id
        when VariantDrop then li.variant_id == obj.id
        else li.variant_id.to_s == obj.to_s || li.product_id.to_s == obj.to_s
        end
      end
    end

    def unit_price_with_measurement(price, measurement)
      return money(price) unless measurement
      ref = measurement.respond_to?(:[]) ? measurement['reference_value'] : nil
      unit = measurement.respond_to?(:[]) ? measurement['reference_unit'] : nil
      "#{money(price)}/#{ref.to_i == 1 ? '' : ref}#{unit}"
    end

    def applicable_disclosures(input) = []

    def payment_type_svg_tag(type, opts = {})
      opts = {} unless opts.is_a?(Hash)
      PaymentIcons.svg(type.to_s, opts['class'])
    end

    def payment_type_img_url(type)
      "/cdn/shopifycloud/payment-icons/#{type}.svg"
    end

    def payment_button(form)
      v = rc.current_form_variant_id
      label = rc.locale.start_with?('nl') ? 'Nu kopen' : 'Buy it now'
      more = rc.locale.start_with?('nl') ? 'Meer betaalopties' : 'More payment options'
      %(<div data-shopify="payment-button" data-has-selling-plan="false" data-has-fixed-selling-plan="false" data-variant-id="#{v}" class="shopify-payment-button"><button class="shopify-payment-button__button shopify-payment-button__button--unbranded" type="button" data-testid="Checkout-button">#{label}</button><button aria-disabled="true" aria-hidden="true" class="shopify-payment-button__more-options shopify-payment-button__button--hidden" type="button">#{more}</button></div>)
    end

    def payment_terms(_form) = ''
    def login_button(_shop, _opts = {}) = ''

    def standard_event_data(input, kind = 'view', opts = {})
      opts = {} unless opts.is_a?(Hash)
      rc.standard_event_payload(input, kind, opts['context']).then { |h| JSON.generate(h) }
    end

    def structured_data(input)
      JSON.generate(rc.structured_data(input))
    end

    def metafield_tag(input, opts = {})
      return '' if input.nil?
      mf = input.is_a?(MetafieldDrop) ? input : nil
      return input.to_s unless mf
      v = mf.value
      case mf.type
      when 'file_reference'
        return '' unless v
        v.is_a?(ImageDrop) ? image_tag(v, opts.is_a?(Hash) ? opts : {}) : %(<a href="#{Util.h(v.to_s)}">#{Util.h(v.to_s)}</a>)
      when 'money' then %(<span class="metafield-money">#{money(v)}</span>)
      when 'date', 'date_time'
        t = to_time(v)
        return %(<span class="metafield-#{mf.type}">#{Util.h(v.to_s)}</span>) unless t
        iso = mf.type == 'date' ? t.strftime('%Y-%m-%d') : t.utc.strftime('%Y-%m-%dT%H:%M:%SZ')
        text = strftime_l(t, named_date_format(mf.type == 'date' ? 'date' : 'date_at_time'))
        %(<time datetime="#{iso}" class="metafield-#{mf.type}">#{text}</time>)
      when 'multi_line_text_field'
        %(<span class="metafield-multi_line_text_field">#{Util.h(v.to_s).gsub(/\r?\n/, '<br />')}</span>)
      else
        rc.metafield_html(mf)
      end
    end

    def metafield_text(input, _opts = {})
      return '' if input.nil?
      Util.strip_html(metafield_tag(input))
    end

    def avatar(_input, _opts = {}) = ''
    def currency_selector(_input, _opts = {}) = ''

    private :parse_size, :size_width, :to_time, :strftime_l, :named_date_format, :color_drop, :adjust_lightness,
            :adjust_saturation
  end

  module PaymentIcons
    module_function

    COLORS = {
      'ideal' => ['#CC0066', 'iDEAL'], 'bancontact' => ['#005498', 'Bancontact'], 'klarna' => ['#FFB3C7', 'Klarna'],
      'paypal' => ['#003087', 'PayPal'], 'visa' => ['#1A1F71', 'VISA'], 'master' => ['#EB001B', 'Mastercard'],
      'mastercard' => ['#EB001B', 'Mastercard'], 'maestro' => ['#0099DF', 'Maestro'], 'apple_pay' => ['#000000', 'Apple Pay'],
      'google_pay' => ['#5F6368', 'G Pay'], 'shopify_pay' => ['#5A31F4', 'Shop Pay'], 'american_express' => ['#2E77BC', 'AMEX']
    }.freeze

    def svg(type, klass)
      color, label = COLORS[type] || ['#555555', type.to_s.tr('_', ' ').capitalize]
      fg = type == 'klarna' ? '#0B051D' : '#FFFFFF'
      fs = label.length > 8 ? 7 : 9
      %(<svg class="#{Util.h(klass || 'icon')}" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" viewBox="0 0 38 24" aria-labelledby="pi-#{type}"><title id="pi-#{type}">#{Util.h(label)}</title><rect x="0.5" y="0.5" width="37" height="23" rx="3" fill="#{color}" stroke="#000" stroke-opacity=".07"/><text x="19" y="15.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="#{fs}" fill="#{fg}">#{Util.h(label)}</text></svg>)
    end
  end
end
