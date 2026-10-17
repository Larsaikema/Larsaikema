# frozen_string_literal: true

require_relative 'util'
require_relative 'image_info'

module Preview
  # ---------------------------------------------------------------------------
  # Plain data models built from the fixture JSON (see FIXTURE_SCHEMA.md).
  # Liquid drops wrap these per request (see drops.rb).
  # ---------------------------------------------------------------------------
  class Metafield
    attr_accessor :namespace, :key, :type, :value, :owner_type

    def initialize(h, owner_type = 'product')
      @namespace = h['namespace'].to_s
      @key = h['key'].to_s
      @type = (h['type'] || 'single_line_text_field').to_s
      v = h['value']
      @value = v.is_a?(String) ? v : JSON.generate(v)
      @owner_type = owner_type
    end

    def self.build_map(list, owner_type)
      map = {}
      case list
      when Array
        list.each do |m|
          mf = Metafield.new(m, owner_type)
          map["#{mf.namespace}.#{mf.key}"] = mf
        end
      when Hash
        list.each do |k, m|
          ns, key = k.to_s.split('.', 2)
          if m.is_a?(Hash) && m.key?('value')
            map[k.to_s] = Metafield.new(m.merge('namespace' => ns, 'key' => key), owner_type)
          else
            map[k.to_s] = Metafield.new({ 'namespace' => ns, 'key' => key, 'value' => m.to_s }, owner_type)
          end
        end
      end
      map
    end
  end

  class StoreImage
    attr_accessor :id, :src, :alt, :width, :height, :position, :product, :variant_ids, :store, :media_id

    def initialize(store, h, id_seed)
      h = { 'src' => h } if h.is_a?(String)
      @store = store
      @src = h['src'].to_s
      @alt = h['alt']
      @id = (h['id'] || Util.stable_id("img:#{id_seed}:#{@src}", 30_000_000_000_000)).to_i
      @media_id = (h['media_id'] || Util.stable_id("media:#{id_seed}:#{@src}", 20_000_000_000_000)).to_i
      @variant_ids = []
      dims = nil
      dims = [h['width'].to_i, h['height'].to_i] if h['width'] && h['height']
      dims ||= ImageInfo.dimensions(local_path)
      @width, @height = dims || [1200, 1200]
    end

    def external?
      @src.match?(%r{\A(https?:)?//})
    end

    def local_path
      return nil if external?
      File.join(@store.images_dir, @src)
    end

    def filename
      File.basename(@src.split('?').first)
    end

    def version
      p = local_path
      p && File.exist?(p) ? File.mtime(p).to_i : 1
    end

    def aspect_ratio
      return 1.0 if @height.to_i.zero?
      (@width.to_f / @height.to_f)
    end
  end

  class OptionValue
    attr_accessor :id, :name, :swatch_color, :swatch_image, :position, :option
  end

  class ProductOption
    attr_accessor :name, :position, :values, :product
  end

  class Variant
    attr_accessor :id, :product, :options, :sku, :barcode, :price, :compare_at_price, :inventory_quantity,
                  :inventory_management, :inventory_policy, :weight, :weight_unit, :requires_shipping, :taxable,
                  :image, :quantity_rule, :metafields, :position, :unit_price, :unit_price_measurement, :raw

    def title
      options.join(' / ')
    end

    def available?
      return true if inventory_management.nil? || inventory_management.to_s.empty?
      return true if inventory_policy.to_s == 'continue'
      inventory_quantity.to_i.positive?
    end

    def weight_in_unit
      case weight_unit
      when 'kg' then weight.to_f / 1000.0
      when 'lb' then weight.to_f / 453.59237
      when 'oz' then weight.to_f / 28.349523125
      else weight.to_f
      end
    end
  end

  class Product
    attr_accessor :id, :handle, :title, :body_html, :vendor, :product_type, :tags, :created_at, :published_at,
                  :updated_at, :template_suffix, :seo, :options, :variants, :images, :metafields, :collections,
                  :gift_card, :requires_selling_plan, :raw, :position

    def price_min = variants.map(&:price).min.to_i
    def price_max = variants.map(&:price).max.to_i
    def available? = variants.any?(&:available?)

    def compare_at_prices
      variants.map(&:compare_at_price).compact.reject(&:zero?)
    end

    def has_only_default_variant?
      variants.size == 1 && options.size == 1 && options[0].name == 'Title' && variants[0].options == ['Default Title']
    end

    def first_available_variant
      variants.find(&:available?)
    end

    def total_inventory
      variants.sum { |v| v.inventory_quantity.to_i }
    end

    def description_text
      Util.strip_html(body_html)
    end
  end

  class Collection
    attr_accessor :id, :handle, :title, :body_html, :image, :sort_order, :rules, :disjunctive, :manual_handles,
                  :template_suffix, :metafields, :published_at, :products, :raw, :seo
  end

  class Link
    attr_accessor :title, :url, :type, :object_type, :object_handle, :links, :id, :store

    def object
      return nil unless object_handle
      case object_type
      when 'collection' then store.collection(object_handle)
      when 'product' then store.product(object_handle)
      when 'page' then store.page(object_handle)
      when 'blog' then store.blog(object_handle)
      when 'article' then store.article_by_path(object_handle)
      when 'policy' then store.policy(object_handle)
      end
    end
  end

  class Menu
    attr_accessor :handle, :title, :links, :id
  end

  class Page
    attr_accessor :id, :handle, :title, :body_html, :template_suffix, :author, :published_at, :metafields, :seo, :raw
  end

  class Article
    attr_accessor :id, :handle, :title, :author, :body_html, :summary_html, :image, :tags, :published_at, :created_at,
                  :updated_at, :blog, :comments, :template_suffix, :metafields, :seo, :raw
  end

  class Blog
    attr_accessor :id, :handle, :title, :articles, :comments, :template_suffix, :metafields, :raw

    def all_tags = articles.flat_map(&:tags).uniq.sort
  end

  class Policy
    attr_accessor :id, :handle, :title, :body, :type
  end

  # ---------------------------------------------------------------------------
  class Store
    attr_reader :data, :shop, :products, :collections, :menus, :pages, :blogs, :policies, :filters_config,
                :images_dir, :path, :best_sellers, :variants_by_id, :mtime

    POLICY_KEYS = {
      'privacy_policy' => 'privacy-policy', 'refund_policy' => 'refund-policy', 'shipping_policy' => 'shipping-policy',
      'terms_of_service' => 'terms-of-service', 'contact_information' => 'contact-information',
      'legal_notice' => 'legal-notice', 'subscription_policy' => 'subscription-policy'
    }.freeze

    @cache = {}
    @mutex = Mutex.new

    def self.load(path, images_dir)
      mt = File.mtime(path).to_f
      @mutex.synchronize do
        cached = @cache[path]
        return cached if cached && cached.mtime == mt
        @cache[path] = new(path, images_dir, mt)
      end
    end

    def initialize(path, images_dir, mtime)
      @path = path
      @mtime = mtime
      @images_dir = images_dir || File.join(File.dirname(path), 'images')
      @data = JSON.parse(File.read(path, encoding: 'UTF-8'))
      build
    end

    def build
      d = @data
      @shop = d['shop'] || {}
      @shop['currency'] ||= 'EUR'
      @shop['money_format'] ||= '€{{amount_with_comma_separator}}'
      @shop['money_with_currency_format'] ||= '€{{amount_with_comma_separator}} EUR'
      @shop['primary_locale'] ||= 'nl'
      @shop['metafield_map'] = Metafield.build_map(@shop['metafields'], 'shop')
      @variants_by_id = {}
      @products = (d['products'] || []).each_with_index.map { |p, i| build_product(p, i) }
                                        .reject { |p| p.raw['status'] && p.raw['status'] != 'active' }
      @products_by_handle = @products.to_h { |p| [p.handle, p] }
      @best_sellers = d['best_sellers'] || []
      @collections = (d['collections'] || []).map { |c| build_collection(c) }
      unless @collections.any? { |c| c.handle == 'all' }
        all = Collection.new
        all.id = Util.stable_id('collection:all', 400_000_000_000)
        all.handle = 'all'
        all.title = d.dig('shop', 'all_collection_title') || 'Producten'
        all.body_html = ''
        all.sort_order = 'best-selling'
        all.rules = []
        all.manual_handles = nil
        all.metafields = {}
        all.seo = {}
        all.published_at = Time.at(1_700_000_000)
        all.raw = { 'virtual' => true }
        all.products = @products.dup
        @all_collection = all
      end
      @collections.each { |c| c.products = resolve_collection_products(c) }
      @collections_by_handle = @collections.to_h { |c| [c.handle, c] }
      @products.each { |p| p.collections = @collections.select { |c| c.products.include?(p) } }
      @filters_config = d['filters'] || [
        { 'source' => 'availability' }, { 'source' => 'price' }
      ]
      @pages = (d['pages'] || []).map { |pg| build_page(pg) }
      @pages_by_handle = @pages.to_h { |p| [p.handle, p] }
      @blogs = (d['blogs'] || []).map { |b| build_blog(b) }
      @blogs_by_handle = @blogs.to_h { |b| [b.handle, b] }
      @policies = (d['policies'] || {}).filter_map do |k, v|
        next unless v
        pol = Policy.new
        pol.type = k
        pol.handle = POLICY_KEYS[k] || Util.handleize(k)
        pol.title = v['title'] || k.tr('_', ' ').capitalize
        pol.body = v['body_html'] || v['body'] || ''
        pol.id = Util.stable_id("policy:#{k}", 100_000_000)
        pol
      end
      @menus = (d['menus'] || []).map { |m| build_menu(m) }
      @menus_by_handle = @menus.to_h { |m| [m.handle, m] }
    end

    # --- lookups ------------------------------------------------------------
    def product(handle) = @products_by_handle[handle.to_s]
    def product_by_id(id) = @products.find { |p| p.id.to_s == id.to_s }
    def variant(id) = @variants_by_id[id.to_i]

    def collection(handle)
      return @all_collection if handle.to_s == 'all' && @all_collection
      @collections_by_handle[handle.to_s]
    end

    def all_collection = collection('all')
    def collections_with_all = @all_collection ? @collections + [@all_collection] : @collections
    def page(handle) = @pages_by_handle[handle.to_s]
    def blog(handle) = @blogs_by_handle[handle.to_s]
    def menu(handle) = @menus_by_handle[handle.to_s]
    def policy(handle) = @policies.find { |p| p.handle == handle.to_s || p.type == handle.to_s }

    def article_by_path(path)
      bh, ah = path.to_s.split('/', 2)
      b = blog(bh)
      b&.articles&.find { |a| a.handle == ah }
    end

    def all_articles = @blogs.flat_map(&:articles)

    def product_types = @products.map(&:product_type).compact.reject(&:empty?).uniq.sort
    def vendors = @products.map(&:vendor).compact.reject(&:empty?).uniq.sort
    def all_tags = @products.flat_map(&:tags).uniq.sort

    # --- builders -----------------------------------------------------------
    def build_product(h, idx)
      p = Product.new
      p.raw = h
      p.position = idx
      p.handle = h['handle'] || Util.handleize(h['title'])
      p.id = (h['id'] || Util.stable_id("product:#{p.handle}", 8_000_000_000_000)).to_i
      p.title = h['title'].to_s
      p.body_html = h['body_html'] || h['description'] || ''
      p.vendor = h['vendor'] || @shop['name']
      p.product_type = h['product_type'] || h['type'] || ''
      p.tags = Array(h['tags'].is_a?(String) ? h['tags'].split(',').map(&:strip) : h['tags'])
      p.created_at = Util.parse_time(h['created_at']) || Time.at(1_700_000_000 + idx * 86_400)
      p.published_at = Util.parse_time(h['published_at']) || p.created_at
      p.updated_at = Util.parse_time(h['updated_at']) || p.published_at
      p.template_suffix = h['template_suffix']
      p.seo = h['seo'] || {}
      p.gift_card = h['gift_card'] ? true : false
      p.requires_selling_plan = false
      p.metafields = Metafield.build_map(h['metafields'], 'product')

      opts = h['options']
      opts = [{ 'name' => 'Title', 'values' => ['Default Title'] }] if opts.nil? || opts.empty?
      p.options = opts.each_with_index.map do |o, oi|
        o = { 'name' => o } if o.is_a?(String)
        po = ProductOption.new
        po.product = p
        po.name = o['name'].to_s
        po.position = oi + 1
        vals = o['values'] || []
        po.values = vals.each_with_index.map do |v, vi|
          v = { 'name' => v } unless v.is_a?(Hash)
          ov = OptionValue.new
          ov.option = po
          ov.name = (v['name'] || v['value']).to_s
          ov.position = vi + 1
          ov.id = (v['id'] || Util.stable_id("ov:#{p.handle}:#{po.name}:#{ov.name}", 1_000_000_000)).to_i
          sw = v['swatch'] || {}
          ov.swatch_color = sw['color'] || v['color']
          ov.swatch_image = sw['image'] || v['swatch_image']
          ov
        end
        po
      end

      p.images = (h['images'] || []).each_with_index.map do |img, ii|
        si = StoreImage.new(self, img, p.handle)
        si.position = ii + 1
        si.product = p
        si
      end

      variants = h['variants']
      variants = [{ 'option1' => 'Default Title', 'price' => h['price'] || 0 }] if variants.nil? || variants.empty?
      p.variants = variants.each_with_index.map do |vh, vi|
        v = Variant.new
        v.raw = vh
        v.product = p
        v.position = vi + 1
        v.options = (1..3).map { |n| vh["option#{n}"] }.compact.map(&:to_s)
        v.options = Array(vh['options']).map(&:to_s) if v.options.empty? && vh['options']
        v.options = ['Default Title'] if v.options.empty?
        # make sure option values exist on the product options
        v.options.each_with_index do |val, oi|
          po = p.options[oi]
          next unless po
          next if po.values.any? { |ov| ov.name == val }
          ov = OptionValue.new
          ov.option = po
          ov.name = val
          ov.position = po.values.size + 1
          ov.id = Util.stable_id("ov:#{p.handle}:#{po.name}:#{val}", 1_000_000_000)
          po.values << ov
        end
        v.id = (vh['id'] || Util.stable_id("variant:#{p.handle}:#{v.options.join('/')}", 40_000_000_000_000)).to_i
        v.sku = vh['sku'].to_s
        v.barcode = vh['barcode']
        v.price = parse_price(vh['price'])
        v.compare_at_price = vh['compare_at_price'].nil? ? nil : parse_price(vh['compare_at_price'])
        v.compare_at_price = nil if v.compare_at_price && v.compare_at_price <= 0
        v.inventory_management = vh.key?('inventory_management') ? vh['inventory_management'] : 'shopify'
        v.inventory_policy = vh['inventory_policy'] || 'deny'
        v.inventory_quantity = vh.key?('inventory_quantity') ? vh['inventory_quantity'].to_i : (v.inventory_management ? 0 : 1)
        v.weight_unit = vh['weight_unit'] || 'kg'
        v.weight = grams(vh['weight'], v.weight_unit, vh['grams'])
        v.requires_shipping = vh.key?('requires_shipping') ? vh['requires_shipping'] : true
        v.taxable = vh.key?('taxable') ? vh['taxable'] : true
        v.quantity_rule = { 'min' => 1, 'max' => nil, 'increment' => 1 }.merge(vh['quantity_rule'] || {})
        v.metafields = Metafield.build_map(vh['metafields'], 'variant')
        v.unit_price_measurement = vh['unit_price_measurement']
        v.unit_price = vh['unit_price']
        if (img_src = vh['image'] || vh['image_src'])
          img_src = img_src['src'] if img_src.is_a?(Hash)
          img = p.images.find { |i| i.src == img_src }
          unless img
            img = StoreImage.new(self, { 'src' => img_src, 'alt' => p.title }, p.handle)
            img.position = p.images.size + 1
            img.product = p
            p.images << img
          end
          img.variant_ids << v.id
          v.image = img
        end
        @variants_by_id[v.id] = v
        v
      end
      # images may list variant skus
      (h['images'] || []).each_with_index do |img, ii|
        next unless img.is_a?(Hash) && img['variant_skus']
        img['variant_skus'].each do |sku|
          v = p.variants.find { |vv| vv.sku == sku }
          next unless v
          p.images[ii].variant_ids << v.id
          v.image ||= p.images[ii]
        end
      end
      p
    end

    def parse_price(v)
      return 0 if v.nil?
      return v if v.is_a?(Integer)
      return (v * 100).round if v.is_a?(Float)
      s = v.to_s.strip
      return (s.tr(',', '.').to_f * 100).round if s.match?(/[.,]/)
      s.to_i
    end

    def grams(w, unit, g)
      return g.to_i if g
      return 0 if w.nil?
      w = w.to_f
      case unit
      when 'kg' then (w * 1000).round
      when 'lb' then (w * 453.59237).round
      when 'oz' then (w * 28.349523125).round
      else w.round
      end
    end

    def build_collection(h)
      c = Collection.new
      c.raw = h
      c.handle = h['handle'] || Util.handleize(h['title'])
      c.id = (h['id'] || Util.stable_id("collection:#{c.handle}", 400_000_000_000)).to_i
      c.title = h['title'].to_s
      c.body_html = h['body_html'] || h['description'] || ''
      c.image = h['image'] ? StoreImage.new(self, h['image'], "collection:#{c.handle}") : nil
      c.sort_order = h['sort_order'] || 'manual'
      c.rules = h['rules'] || []
      c.disjunctive = h['disjunctive'] ? true : false
      c.manual_handles = h['products']
      c.template_suffix = h['template_suffix']
      c.metafields = Metafield.build_map(h['metafields'], 'collection')
      c.published_at = Util.parse_time(h['published_at']) || Time.at(1_700_000_000)
      c.seo = h['seo'] || {}
      c
    end

    def resolve_collection_products(c)
      return c.products if c.raw['virtual']
      if c.manual_handles
        c.manual_handles.filter_map { |hd| product(hd) }
      else
        @products.select { |p| rules_match?(p, c.rules, c.disjunctive) }
      end
    end

    def rules_match?(p, rules, disjunctive)
      return true if rules.nil? || rules.empty?
      results = rules.map { |r| rule_match?(p, r) }
      disjunctive ? results.any? : results.all?
    end

    def rule_match?(p, r)
      col = r['column'].to_s
      rel = r['relation'].to_s
      cond = r['condition'].to_s
      values = case col
               when 'title' then [p.title]
               when 'type', 'product_type' then [p.product_type]
               when 'vendor' then [p.vendor]
               when 'tag' then p.tags
               when 'variant_price' then p.variants.map { |v| v.price / 100.0 }
               when 'variant_compare_at_price' then p.variants.map { |v| (v.compare_at_price || 0) / 100.0 }
               when 'variant_inventory' then p.variants.map(&:inventory_quantity)
               when 'variant_title' then p.variants.map(&:title)
               when 'variant_weight' then p.variants.map { |v| v.weight / 1000.0 }
               when 'is_price_reduced' then [p.variants.any? { |v| v.compare_at_price.to_i > v.price }.to_s]
               else []
               end
      case rel
      when 'equals' then values.any? { |v| v.to_s.casecmp?(cond) }
      when 'not_equals' then values.none? { |v| v.to_s.casecmp?(cond) }
      when 'greater_than' then values.any? { |v| v.to_f > cond.to_f }
      when 'less_than' then values.any? { |v| v.to_f < cond.to_f }
      when 'starts_with' then values.any? { |v| v.to_s.downcase.start_with?(cond.downcase) }
      when 'ends_with' then values.any? { |v| v.to_s.downcase.end_with?(cond.downcase) }
      when 'contains' then values.any? { |v| v.to_s.downcase.include?(cond.downcase) }
      when 'not_contains' then values.none? { |v| v.to_s.downcase.include?(cond.downcase) }
      else false
      end
    end

    def build_page(h)
      pg = Page.new
      pg.raw = h
      pg.handle = h['handle'] || Util.handleize(h['title'])
      pg.id = (h['id'] || Util.stable_id("page:#{pg.handle}", 90_000_000_000)).to_i
      pg.title = h['title'].to_s
      pg.body_html = h['body_html'] || h['content'] || ''
      pg.template_suffix = h['template_suffix']
      pg.author = h['author'] || @shop['name']
      pg.published_at = Util.parse_time(h['published_at']) || Time.at(1_700_000_000)
      pg.metafields = Metafield.build_map(h['metafields'], 'page')
      pg.seo = h['seo'] || {}
      pg
    end

    def build_blog(h)
      b = Blog.new
      b.raw = h
      b.handle = h['handle'] || Util.handleize(h['title'])
      b.id = (h['id'] || Util.stable_id("blog:#{b.handle}", 80_000_000_000)).to_i
      b.title = h['title'].to_s
      b.comments = h['comments'] || 'disabled'
      b.template_suffix = h['template_suffix']
      b.metafields = Metafield.build_map(h['metafields'], 'blog')
      b.articles = (h['articles'] || []).map do |a|
        ar = Article.new
        ar.raw = a
        ar.blog = b
        ar.handle = a['handle'] || Util.handleize(a['title'])
        ar.id = (a['id'] || Util.stable_id("article:#{b.handle}:#{ar.handle}", 550_000_000_000)).to_i
        ar.title = a['title'].to_s
        ar.author = a['author'] || @shop['name']
        ar.body_html = a['body_html'] || a['content'] || ''
        ar.summary_html = a['summary_html'] || a['excerpt'] || ''
        ar.image = a['image'] ? StoreImage.new(self, a['image'], "article:#{ar.handle}") : nil
        ar.tags = Array(a['tags'])
        ar.published_at = Util.parse_time(a['published_at']) || Time.at(1_700_000_000)
        ar.created_at = Util.parse_time(a['created_at']) || ar.published_at
        ar.updated_at = Util.parse_time(a['updated_at']) || ar.published_at
        ar.comments = a['comments'] || []
        ar.template_suffix = a['template_suffix']
        ar.metafields = Metafield.build_map(a['metafields'], 'article')
        ar.seo = a['seo'] || {}
        ar
      end.sort_by { |a| -a.published_at.to_i }
      b
    end

    def build_menu(h)
      m = Menu.new
      m.handle = h['handle']
      m.title = h['title'] || h['handle']
      m.id = Util.stable_id("menu:#{m.handle}", 200_000_000_000)
      m.links = (h['items'] || h['links'] || []).each_with_index.map { |it, i| build_link(it, "#{m.handle}:#{i}") }
      m
    end

    def build_link(h, seed)
      l = Link.new
      l.store = self
      l.id = Util.stable_id("link:#{seed}", 300_000_000_000)
      l.title = h['title'].to_s
      t = h['type'].to_s
      hd = h['handle'] || h['resource']
      case t
      when 'collection', 'collection_link'
        l.type = 'collection_link'; l.object_type = 'collection'; l.object_handle = hd
        l.url = "/collections/#{hd}"
      when 'product', 'product_link'
        l.type = 'product_link'; l.object_type = 'product'; l.object_handle = hd
        l.url = "/products/#{hd}"
      when 'page', 'page_link'
        l.type = 'page_link'; l.object_type = 'page'; l.object_handle = hd
        l.url = "/pages/#{hd}"
      when 'blog', 'blog_link'
        l.type = 'blog_link'; l.object_type = 'blog'; l.object_handle = hd
        l.url = "/blogs/#{hd}"
      when 'article', 'article_link'
        l.type = 'article_link'; l.object_type = 'article'; l.object_handle = hd
        l.url = "/blogs/#{hd}"
      when 'policy', 'policy_link'
        l.type = 'policy_link'; l.object_type = 'policy'; l.object_handle = hd
        l.url = "/policies/#{hd}"
      when 'search', 'search_link'
        l.type = 'search_link'; l.url = '/search'
      when 'frontpage', 'frontpage_link'
        l.type = 'frontpage_link'; l.url = '/'
      when 'catalog', 'catalog_link'
        l.type = 'catalog_link'; l.url = '/collections/all'
      when 'collections', 'collections_link'
        l.type = 'collections_link'; l.url = '/collections'
      else
        l.url = h['url'].to_s
        l.type = infer_link_type(l)
      end
      l.url = h['url'] if h['url'] && t.empty?
      l.links = (h['items'] || h['links'] || []).each_with_index.map { |it, i| build_link(it, "#{seed}:#{i}") }
      l
    end

    def infer_link_type(l)
      u = l.url.to_s
      case u
      when '/' then 'frontpage_link'
      when '/search' then 'search_link'
      when '/collections/all' then 'catalog_link'
      when '/collections' then 'collections_link'
      when %r{\A/collections/([^/?#]+)\z}
        l.object_type = 'collection'; l.object_handle = Regexp.last_match(1); 'collection_link'
      when %r{\A/products/([^/?#]+)\z}
        l.object_type = 'product'; l.object_handle = Regexp.last_match(1); 'product_link'
      when %r{\A/pages/([^/?#]+)\z}
        l.object_type = 'page'; l.object_handle = Regexp.last_match(1); 'page_link'
      when %r{\A/blogs/([^/?#]+)\z}
        l.object_type = 'blog'; l.object_handle = Regexp.last_match(1); 'blog_link'
      when %r{\A/blogs/([^/?#]+/[^/?#]+)\z}
        l.object_type = 'article'; l.object_handle = Regexp.last_match(1); 'article_link'
      when %r{\A/policies/([^/?#]+)\z}
        l.object_type = 'policy'; l.object_handle = Regexp.last_match(1); 'policy_link'
      else 'http_link'
      end
    end

    # --- sorting / filtering / search ---------------------------------------
    def sort_products(list, sort_by, collection = nil)
      sort_by = collection&.sort_order if sort_by.nil? || sort_by.empty?
      sort_by = normalize_sort(sort_by)
      case sort_by
      when 'manual' then list
      when 'best-selling'
        list.sort_by.with_index { |p, i| [(@best_sellers.index(p.handle) || 10_000), i] }
      when 'title-ascending' then list.sort_by { |p| p.title.downcase }
      when 'title-descending' then list.sort_by { |p| p.title.downcase }.reverse
      when 'price-ascending' then list.sort_by.with_index { |p, i| [p.price_min, i] }
      when 'price-descending' then list.sort_by.with_index { |p, i| [-p.price_min, i] }
      when 'created-ascending' then list.sort_by { |p| p.created_at.to_i }
      when 'created-descending' then list.sort_by { |p| -p.created_at.to_i }
      else list
      end
    end

    def normalize_sort(s)
      {
        'alpha-asc' => 'title-ascending', 'alpha-desc' => 'title-descending', 'price-asc' => 'price-ascending',
        'price-desc' => 'price-descending', 'created' => 'created-ascending', 'created-desc' => 'created-descending',
        'best_selling' => 'best-selling'
      }[s.to_s] || s.to_s
    end

    # Shopify-style search: plain words (AND), field filters (id:, title:, tag:, product_type:, vendor:, sku:),
    # alternatives joined with OR, exclusions with a leading '-'.
    def search(terms, types: %w[product page article], prefix: false)
      q = terms.to_s.strip
      return [] if q.empty?
      alternatives = q.split(/\s+OR\s+/).map { |alt| parse_search_terms(alt) }.reject { |t| t[:words].empty? && t[:fields].empty? }
      return [] if alternatives.empty?
      results = []
      candidates = []
      candidates += @products.map { |p| [p, 0] } if types.include?('product')
      candidates += @pages.map { |pg| [pg, 1] } if types.include?('page')
      candidates += all_articles.map { |a| [a, 2] } if types.include?('article')
      candidates.each_with_index do |(obj, tier), idx|
        best = alternatives.map { |alt| score_object(obj, alt, prefix) }.max
        results << [best, tier, idx, obj] if best.positive?
      end
      results.sort_by { |sc, tier, idx, _| [-sc, tier, idx] }.map(&:last)
    end

    def parse_search_terms(str)
      words = []
      fields = []
      excludes = []
      str.scan(/-?[\w.]+:"[^"]*"|-?[\w.]+:\S+|"[^"]*"|\S+/).each do |tok|
        neg = tok.start_with?('-') && tok.length > 1
        tok = tok[1..] if neg
        if (m = tok.match(/\A([\w.]+):"?([^"]*)"?\z/))
          (neg ? excludes : fields) << [m[1].downcase, m[2].downcase]
        else
          w = tok.delete('"').downcase
          next if w.empty?
          (neg ? excludes : words) << w
        end
      end
      { words: words, fields: fields, excludes: excludes }
    end

    def search_text(obj)
      case obj
      when Product
        [obj.title, obj.title, obj.vendor, obj.product_type, obj.tags.join(' '), obj.variants.map(&:sku).join(' '),
         obj.variants.map(&:title).join(' '), obj.description_text].compact.join(' ').downcase
      when Page then [obj.title, Util.strip_html(obj.body_html)].join(' ').downcase
      when Article then [obj.title, obj.tags.join(' '), Util.strip_html(obj.body_html), obj.author].join(' ').downcase
      else ''
      end
    end

    def field_match?(obj, field, value)
      case field
      when 'id' then obj.respond_to?(:id) && obj.id.to_s == value
      when 'title' then obj.title.to_s.downcase.include?(value)
      when 'handle' then obj.handle.to_s == value
      when 'tag' then obj.respond_to?(:tags) && obj.tags.map(&:downcase).include?(value)
      when 'product_type' then obj.is_a?(Product) && obj.product_type.to_s.downcase == value
      when 'vendor' then obj.is_a?(Product) && obj.vendor.to_s.downcase == value
      when 'sku', 'variants.sku' then obj.is_a?(Product) && obj.variants.any? { |v| v.sku.to_s.downcase == value }
      when 'body' then search_text(obj).include?(value)
      else false
      end
    end

    def score_object(obj, alt, prefix)
      text = search_text(obj)
      return 0 if alt[:excludes].any? { |e| e.is_a?(Array) ? field_match?(obj, *e) : text.include?(e) }
      return 0 unless alt[:fields].all? { |f, v| field_match?(obj, f, v) }
      tokens = nil
      score = alt[:fields].size
      alt[:words].each_with_index do |w, wi|
        last = (wi == alt[:words].size - 1)
        hit = text.include?(w)
        if !hit && prefix && last
          tokens ||= text.split(/[^\p{Alnum}]+/u)
          hit = tokens.any? { |t| t.start_with?(w) }
        end
        return 0 unless hit
        score += 1
      end
      title = obj.title.to_s.downcase
      score += 2 if !alt[:words].empty? && alt[:words].all? { |w| title.include?(w) }
      score
    end
  end
end
