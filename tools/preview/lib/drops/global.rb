# frozen_string_literal: true

module Preview
  class ShopDrop < BaseDrop
    def s = rc.store.shop
    def model_key = 'shop'
    def id = Util.stable_id("shop:#{name}", 60_000_000_000)
    def name = s['name']
    def email = s['email']
    def phone = s['phone']
    def description = s['description']
    def domain = rc.host
    def permanent_domain = "#{Util.handleize(name)}.myshopify.com"
    def url = rc.origin
    def secure_url = rc.origin
    def currency = s['currency']
    def money_format = s['money_format']
    def money_with_currency_format = s['money_with_currency_format']
    def locale = s['primary_locale']
    def enabled_currencies = [rc.currency_drop]
    def enabled_payment_types = s['payment_types'] || []
    def published_locales = rc.published_locales
    def metafields = MetafieldsDrop.new(rc, s['metafield_map'])
    def types = rc.store.product_types
    def vendors = rc.store.vendors
    def products_count = rc.store.products.size
    def collections_count = rc.store.collections.size
    def customer_accounts_enabled = s.key?('customer_accounts_enabled') ? s['customer_accounts_enabled'] : true
    def customer_accounts_optional = true
    def accepts_gift_cards = true
    def taxes_included = s['taxes_included'] ? true : false
    def password_message = s['password_message']
    def address = rc.address_drop
    def brand = BrandDrop.new(rc)
    def policies = rc.store.policies.map { |p| PolicyDrop.new(rc, p) }
    def privacy_policy = policy('privacy_policy')
    def refund_policy = policy('refund_policy')
    def shipping_policy = policy('shipping_policy')
    def terms_of_service = policy('terms_of_service')
    def subscription_policy = policy('subscription_policy')
    def contact_information = policy('contact_information')
    def legal_notice = policy('legal_notice')
    def features = { 'follow_on_shop?' => false, 'follow_on_shop' => false }
    def to_s = name

    def policy(type)
      p = rc.store.policies.find { |x| x.type == type }
      p && PolicyDrop.new(rc, p)
    end
  end

  class BrandDrop < BaseDrop
    def b = rc.store.shop['brand'] || {}
    def model_key = 'brand'
    def slogan = b['slogan']
    def short_description = b['short_description']
    def colors = b['colors'] || {}
    def metafields = MetafieldsDrop.new(rc, {})
    def logo = img(b['logo'])
    def square_logo = img(b['square_logo'] || b['logo'])
    def cover_image = img(b['cover_image'])

    def img(src)
      return nil unless src
      rc.image_drop(StoreImage.new(rc.store, { 'src' => src, 'alt' => rc.store.shop['name'] }, 'brand'))
    end
  end

  class AddressDrop < BaseDrop
    def a = rc.store.shop['address'] || {}
    def model_key = 'address'
    def address1 = a['address1']
    def address2 = a['address2']
    def city = a['city']
    def zip = a['zip']
    def country = a['country']
    def country_code = a['country_code']
    def province = a['province']
    def province_code = a['province_code']
    def company = a['company'] || rc.store.shop['name']
    def phone = a['phone'] || rc.store.shop['phone']
    def street = [address1, address2].compact.join(', ')
    def summary = [street, zip, city, country].compact.reject(&:empty?).join(', ')
    def to_s = summary
  end

  class CurrencyDrop < BaseDrop
    SYMBOLS = { 'EUR' => '€', 'USD' => '$', 'GBP' => '£' }.freeze
    NAMES = { 'EUR' => 'Euro', 'USD' => 'US Dollar', 'GBP' => 'British Pound' }.freeze

    def initialize(rc, code)
      super(rc)
      @code = code
    end

    def model_key = @code
    def iso_code = @code
    def symbol = SYMBOLS[@code] || @code
    def name = NAMES[@code] || @code
    def to_s = @code
  end

  class ShopLocaleDrop < BaseDrop
    def initialize(rc, h)
      super(rc)
      @h = h
    end

    def model_key = @h['iso_code']
    def iso_code = @h['iso_code']
    def name = @h['name'] || @h['iso_code']
    def endonym_name = @h['endonym_name'] || name
    def primary = @h['primary'] ? true : false
    def root_url = primary ? '/' : "/#{iso_code}"
    def direction = 'ltr'
    def to_s = iso_code
  end

  class CountryDrop < BaseDrop
    def initialize(rc, h)
      super(rc)
      @h = h
    end

    def model_key = @h['iso_code']
    def iso_code = @h['iso_code']
    def name = @h['name']
    def currency = rc.currency_drop(@h['currency'] || rc.store.shop['currency'])
    def unit_system = 'metric'
    def available_languages = rc.published_locales
    def continent = 'Europe'
    def popular? = true
    def market = MarketDrop.new(rc)
    def to_s = name
  end

  class MarketDrop < BaseDrop
    def model_key = 'market'
    def id = 1
    def handle = 'nl'
    def metafields = MetafieldsDrop.new(rc, {})
  end

  class LocalizationDrop < BaseDrop
    def model_key = 'localization'
    def countries = (rc.store.shop['countries'] || [{ 'iso_code' => rc.store.shop['country'] || 'NL', 'name' => 'Nederland' }])
    def available_countries = countries.map { |c| CountryDrop.new(rc, c) }
    def available_languages = rc.published_locales
    def country = available_countries.find { |c| c.iso_code == rc.country_code } || available_countries.first
    def language = rc.current_locale_drop
    def market = MarketDrop.new(rc)
  end

  class RequestDrop < BaseDrop
    def model_key = 'request'
    def page_type = rc.page_type
    def path = rc.path
    def host = rc.host
    def origin = rc.origin
    def locale = rc.current_locale_drop
    def design_mode = false
    def visual_preview_mode = false
  end

  class RoutesDrop < BaseDrop
    ROUTES = {
      'root_url' => '/', 'account_url' => '/account', 'account_login_url' => '/account/login',
      'account_logout_url' => '/account/logout', 'account_register_url' => '/account/register',
      'account_addresses_url' => '/account/addresses', 'account_recover_url' => '/account/recover',
      'collections_url' => '/collections', 'all_products_collection_url' => '/collections/all',
      'search_url' => '/search', 'predictive_search_url' => '/search/suggest', 'cart_url' => '/cart',
      'cart_add_url' => '/cart/add', 'cart_change_url' => '/cart/change', 'cart_clear_url' => '/cart/clear',
      'cart_update_url' => '/cart/update', 'product_recommendations_url' => '/recommendations/products',
      'storefront_login_url' => '/password'
    }.freeze

    def model_key = 'routes'
    def liquid_method_missing(k) = route(k.to_s)

    def route(k)
      r = ROUTES[k]
      return r if r.nil? || rc.locale_prefix.to_s.empty?
      r == '/' ? rc.locale_prefix : "#{rc.locale_prefix}#{r}"
    end
    ROUTES.each_key { |k| define_method(k) { route(k) } }
  end

  class TemplateDrop < BaseDrop
    def model_key = 'template'
    def name = rc.template_name
    def suffix = rc.template_suffix
    def directory = rc.template_directory

    def to_s
      base = directory ? "#{directory}/#{name}" : name.to_s
      suffix ? "#{base}.#{suffix}" : base
    end
  end

  class CustomerDrop < BaseDrop
  end

  class ImagesDrop < BaseDrop
    def model_key = 'images'

    def liquid_method_missing(name)
      file = name.to_s
      path = File.join(rc.store.images_dir, file)
      return nil unless File.exist?(path)
      rc.image_drop(StoreImage.new(rc.store, { 'src' => file }, 'images'))
    end
  end

  class ClosestDrop < BaseDrop
    def model_key = object_id

    def liquid_method_missing(k) = rc.closest(k.to_s)
    def product = rc.closest('product')
    def collection = rc.closest('collection')
    def article = rc.closest('article')
    def blog = rc.closest('blog')
    def page = rc.closest('page')
    def metaobject = rc.closest('metaobject')
  end

  class SearchDrop < BaseDrop
    def initialize(rc, terms, types, performed)
      super(rc)
      @terms = terms.to_s
      @types = types
      @performed = performed
    end

    def model_key = ['search', @terms]
    def performed = @performed
    def terms = @terms
    def types = @types

    def raw_results
      @raw_results ||= if @performed
                         ua = rc.query_param('options[unavailable_products]').to_s
                         rc.store.search(@terms, types: @types, prefix: rc.query_param('options[prefix]') == 'last',
                                                 unavailable: %w[show hide last].include?(ua) ? ua : 'last')
                       else
                         []
                       end
    end

    def filtering
      prods = raw_results.grep(Product)
      @filtering ||= ProductFiltering.new(rc, prods, rc.store.filters_config, apply_params: true)
    end

    def filtered_results
      @filtered_results ||= begin
        allowed = filtering.products
        list = raw_results.select { |r| !r.is_a?(Product) || allowed.include?(r) }
        sb = sort_by
        if sb && sb != 'relevance'
          prods = rc.store.sort_products(list.grep(Product), sb)
          list = prods + list.reject { |r| r.is_a?(Product) }
        end
        list
      end
    end

    def results
      @results ||= PaginatedArray.build(filtered_results.map { |r| rc.drop_for(r) })
    end

    def results_count = filtered_results.size
    def filters = (@performed ? filtering.filter_drops : [])
    def sort_by = rc.query_param('sort_by').to_s.then { |s| s.empty? ? nil : s }
    def default_sort_by = 'relevance'
    def sort_options = rc.search_sort_options
  end

  class PredictiveSearchDrop < BaseDrop
    def initialize(rc, terms, types, limit)
      super(rc)
      @terms = terms.to_s
      @types = types
      @limit = limit
    end

    def model_key = ['psearch', @terms]
    def performed = !@terms.strip.empty?
    def terms = @terms
    def types = @types

    # predictive search: prefix match on the last word, default fields title/product_type/variants.title/vendor
    def results
      @results ||= begin
        f = rc.query_param('resources[options][fields]').to_s.split(',').map(&:strip).reject(&:empty?)
        ua = rc.query_param('resources[options][unavailable_products]').to_s
        rc.store.search(@terms, types: %w[product page article], prefix: true,
                                fields: f.empty? ? Store::PREDICTIVE_FIELDS : f,
                                unavailable: %w[show hide last].include?(ua) ? ua : 'last')
      end
    end

    def resources
      {
        'products' => (@types.include?('product') ? results.grep(Product).first(@limit).map { |p| rc.product_drop(p) } : []),
        'collections' => (@types.include?('collection') ? matching_collections.first(@limit).map { |c| rc.collection_drop(c) } : []),
        'pages' => (@types.include?('page') ? results.grep(Page).first(@limit).map { |p| rc.page_drop(p) } : []),
        'articles' => (@types.include?('article') ? results.grep(Article).first(@limit).map { |a| rc.article_drop(a) } : []),
        'queries' => (@types.include?('query') ? queries : [])
      }
    end

    def matching_collections
      words = Store.search_tokens(@terms)
      return [] if words.empty?
      rc.store.collections.select do |c|
        toks = Store.search_tokens(c.title)
        words.each_with_index.all? { |w, i| rc.store.token_hit?(toks, w, i == words.size - 1) }
      end
    end

    # query suggestions: the typed terms plus product titles that contain them as words
    def queries
      t = @terms.strip
      return [] if t.empty?
      sugg = [t]
      words = Store.search_tokens(t)
      results.grep(Product).first(3).each do |p|
        toks = Store.search_tokens(p.title)
        sugg << p.title.downcase if words.each_with_index.all? { |w, i| rc.store.token_hit?(toks, w, i == words.size - 1) }
      end
      sugg.uniq.first(@limit).map { |q| QueryDrop.new(rc, q, t) }
    end
  end

  class QueryDrop < BaseDrop
    def initialize(rc, text, terms)
      super(rc)
      @text = text
      @terms = terms
    end

    def model_key = @text
    def text = @text
    def url = rc.localize("/search?q=#{Util.url_encode(@text)}&_pos=1&_psq=#{Util.url_encode(@terms)}&_ss=e&_v=1.0")

    def styled_text
      idx = @text.downcase.index(@terms.downcase)
      return %(<mark class="predictive-search__highlight">#{Util.h(@text)}</mark>) unless idx
      before = @text[0...idx]
      match = @text[idx, @terms.size]
      after = @text[(idx + @terms.size)..]
      "#{Util.h(before)}#{Util.h(match)}<mark class=\"predictive-search__highlight\">#{Util.h(after)}</mark>"
    end

    def as_json = { 'text' => text, 'styled_text' => styled_text, 'url' => url }
    def to_s = @text
  end

  class RecommendationsDrop < BaseDrop
    def initialize(rc, product, limit, intent)
      super(rc)
      @product = product
      @limit = limit
      @intent = intent
    end

    def model_key = ['reco', @product&.id]
    def performed = !@product.nil?
    def performed? = performed
    def intent = @intent

    def list
      return [] unless @product
      return [] if @intent == 'complementary' && !rc.store.data.dig('complementary', @product.handle)
      if @intent == 'complementary'
        return Array(rc.store.data.dig('complementary', @product.handle)).filter_map { |h| rc.store.product(h) }.first(@limit)
      end
      same = rc.store.products.reject { |p| p == @product }
      scored = same.map do |p|
        s = 0
        s += 3 if p.product_type == @product.product_type
        s += (p.tags & @product.tags).size
        s += 2 if (p.collections & @product.collections).any?
        [s, p]
      end
      # strongest matches first; a fresh store (no purchase history) still fills the slots like Shopify does
      scored.sort_by.with_index { |(s, _), i| [-s, i] }.map(&:last).reject { |p| !p.available? && scored.size > @limit }.first(@limit)
    end

    def products = list.map { |p| rc.product_drop(p) }
    def products_count = list.size
  end

  class FormErrorsDrop < BaseDrop
    def initialize(rc, errors)
      super(rc)
      @errors = errors || {}
    end

    # Shopify's localized field names / messages for storefront form errors (errors are stored as codes
    # such as 'invalid' / 'blank' and localized for the page's locale at render time).
    FIELDS = {
      'nl' => { 'email' => 'E-mail', 'password' => 'Wachtwoord', 'body' => 'Bericht', 'name' => 'Naam', 'author' => 'Naam',
                'phone' => 'Telefoonnummer', 'first_name' => 'Voornaam', 'last_name' => 'Achternaam', 'form' => 'Formulier' },
      'en' => { 'email' => 'Email', 'password' => 'Password', 'body' => 'Body', 'name' => 'Name', 'author' => 'Author',
                'phone' => 'Phone', 'first_name' => 'First name', 'last_name' => 'Last name', 'form' => 'Form' }
    }.freeze
    MESSAGES = {
      'nl' => { 'invalid' => 'is ongeldig', 'blank' => 'mag niet leeg zijn', 'incorrect' => 'is onjuist',
                'taken' => 'is al in gebruik' },
      'en' => { 'invalid' => 'is invalid', 'blank' => "can't be blank", 'incorrect' => 'is incorrect',
                'taken' => 'has already been taken' }
    }.freeze

    def lang = (FIELDS.key?(rc.locale.to_s[0, 2]) ? rc.locale.to_s[0, 2] : 'en')

    def model_key = object_id
    def messages = @errors.to_h { |k, v| [k, MESSAGES[lang][v.to_s] || v.to_s] }
    def translated_fields = @errors.keys.to_h { |k| [k, FIELDS[lang][k.to_s] || k.to_s.tr('_', ' ').capitalize] }
    def size = @errors.size
    def each(&) = @errors.keys.each(&)
    def to_s = messages.values.join(', ')
    def blank? = @errors.empty?
    def empty? = @errors.empty?
    def include?(k) = @errors.key?(k.to_s)
    def first = @errors.keys.first
  end

  class FormDrop < BaseDrop
    def initialize(rc, type, id, posted_successfully, errors, values = {})
      super(rc)
      @type = type
      @id = id
      @ok = posted_successfully
      @errors = errors
      @values = values || {}
    end

    def model_key = @id
    # Shopify echoes posted contact[...] fields; form.id is the posted contact[id] value (blank before posting).
    def id = @values['id']
    def html_id = @id
    def type = @type
    def posted_successfully? = @ok
    def posted_successfully = @ok
    def errors = (@errors && !@errors.empty? ? FormErrorsDrop.new(rc, @errors) : nil)
    def liquid_method_missing(k) = @values[k.to_s]
    def email = @values['email']
    def name = @values['name']
    def body = @values['body']
    def author = @values['author']
    def password_needed = true
    def set_as_default_checkbox = ''
  end

  class PaginateDrop < BaseDrop
    def initialize(rc, total, page_size, current_page, window_size = 3)
      super(rc)
      @total = total
      @page_size = [page_size.to_i, 1].max
      @pages = [(total.to_f / @page_size).ceil, 1].max
      @current = current_page.clamp(1, [@pages, 1].max)
      @window = window_size
    end

    def model_key = object_id
    def current_page = @current
    def current_offset = (@current - 1) * @page_size
    def items = @total
    def page_size = @page_size
    def pages = @pages
    def page_param = 'page'

    def link(title, page) = { 'title' => title.to_s, 'url' => rc.url_with_params(set: { 'page' => page.to_s }), 'is_link' => true }
    def nolink(title) = { 'title' => title.to_s, 'is_link' => false }

    def previous = @current > 1 ? link(rc.tr_default('previous'), @current - 1) : nil
    def next = @current < @pages ? link(rc.tr_default('next'), @current + 1) : nil

    def parts
      return [] if @pages <= 1
      out = []
      hellip = false
      1.upto(@pages) do |pg|
        if pg == @current
          out << nolink(pg)
          hellip = false
        elsif pg == 1 || pg == @pages || ((pg - @current).abs < @window)
          out << link(pg, pg)
          hellip = false
        elsif !hellip
          out << nolink('&hellip;')
          hellip = true
        end
      end
      out
    end
  end
end
