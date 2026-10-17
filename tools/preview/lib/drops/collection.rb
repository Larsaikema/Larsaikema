# frozen_string_literal: true

module Preview
  # Storefront filtering (Search & Discovery) applied to a product list based on request params.
  class ProductFiltering
    attr_reader :rc, :base_products, :config

    def initialize(rc, base_products, config, apply_params: true)
      @rc = rc
      @base_products = base_products
      @config = config
      @apply = apply_params
    end

    def params = @apply ? rc.query_params : {}

    def defs
      @defs ||= config.filter_map { |c| build_def(c) }
    end

    def build_def(c)
      src = c['source'].to_s
      case src
      when 'availability'
        { kind: :availability, label: c['label'] || rc.tr_default('availability'), param: 'filter.v.availability', type: 'boolean' }
      when 'price'
        { kind: :price, label: c['label'] || rc.tr_default('price'), param: 'filter.v.price', type: 'price_range' }
      when 'option'
        name = c['name'].to_s
        { kind: :option, name: name, label: c['label'] || name, param: "filter.v.option.#{Util.handleize(name)}", type: 'list' }
      when 'product_type'
        { kind: :product_type, label: c['label'] || rc.tr_default('product_type'), param: 'filter.p.product_type', type: 'list' }
      when 'vendor'
        { kind: :vendor, label: c['label'] || rc.tr_default('vendor'), param: 'filter.p.vendor', type: 'list' }
      when 'tag'
        { kind: :tag, label: c['label'] || 'Tags', param: 'filter.p.tag', type: 'list' }
      when 'metafield'
        owner = c['owner'] == 'variant' ? 'v' : 'p'
        { kind: :metafield, owner: owner, ns: c['namespace'], key: c['key'], label: c['label'] || c['key'].to_s.capitalize,
          param: "filter.#{owner}.m.#{c['namespace']}.#{c['key']}", type: 'list' }
      end
    end

    def active_values(d)
      return [] unless params
      Array(params[d[:param]]).reject { |v| v.to_s.empty? }
    end

    def price_bounds
      gte = params && params['filter.v.price.gte']&.first
      lte = params && params['filter.v.price.lte']&.first
      [gte && !gte.empty? ? (gte.tr(',', '.').to_f * 100).round : nil,
       lte && !lte.empty? ? (lte.tr(',', '.').to_f * 100).round : nil]
    end

    def product_values(p, d)
      case d[:kind]
      when :option
        idx = p.options.index { |o| o.name.casecmp?(d[:name]) }
        idx ? p.variants.map { |v| v.options[idx] }.compact.uniq : []
      when :product_type then [p.product_type].reject(&:empty?)
      when :vendor then [p.vendor].compact
      when :tag then p.tags
      when :metafield
        mf = (d[:owner] == 'p' ? [p.metafields] : p.variants.map(&:metafields)).filter_map { |m| m["#{d[:ns]}.#{d[:key]}"] }
        mf.flat_map do |m|
          if m.type.start_with?('list.')
            (JSON.parse(m.value) rescue [m.value]).map(&:to_s)
          else
            [m.value.to_s]
          end
        end.uniq
      else []
      end
    end

    # ---- Shopify semantics -------------------------------------------------------------------
    # * values of ONE filter are OR-ed, different filters are AND-ed;
    # * variant-level filters (filter.v.option.*, filter.v.availability, filter.v.price, filter.v.m.*)
    #   are evaluated together on each variant: a product matches when at least one of its variants
    #   satisfies ALL active variant filters (3x6 + Blauw needs a 3x6/Blauw variant);
    # * availability=1 -> that variant is available, availability=0 -> that variant is sold out;
    # * product-level filters (type, vendor, tag, filter.p.m.*) test the product.
    # Facet counts: products that would match with this value selected, other filters applied,
    # the filter's own other values ignored.
    def variant_level?(d)
      %i[availability price option].include?(d[:kind]) || (d[:kind] == :metafield && d[:owner] == 'v')
    end

    def active?(d)
      d[:kind] == :price ? price_bounds.any? : !active_values(d).empty?
    end

    def variant_values(v, d)
      case d[:kind]
      when :option
        idx = v.product.options.index { |o| o.name.casecmp?(d[:name]) }
        idx ? [v.options[idx]].compact : []
      when :metafield
        m = v.metafields["#{d[:ns]}.#{d[:key]}"]
        return [] unless m
        m.type.start_with?('list.') ? ((JSON.parse(m.value) rescue [m.value]).map(&:to_s)) : [m.value.to_s]
      else []
      end
    end

    # variant v satisfies filter d (with the given values, default: the active ones)
    def variant_ok?(v, d, vals = nil)
      case d[:kind]
      when :availability
        vals ||= active_values(d)
        return true if vals.empty? || (vals.include?('1') && vals.include?('0'))
        vals.include?('1') ? v.available? : !v.available?
      when :price
        lo, hi = price_bounds
        (lo.nil? || v.price >= lo) && (hi.nil? || v.price <= hi)
      else
        vals ||= active_values(d)
        vals.empty? || (variant_values(v, d) & vals).any?
      end
    end

    def product_ok?(p, d, vals = nil)
      vals ||= active_values(d)
      vals.empty? || (product_values(p, d) & vals).any?
    end

    # p matches every active filter except `except`; `force` = [def, values] adds/overrides one filter
    def match?(p, except: nil, force: nil)
      fd, fvals = force
      vdefs = []
      defs.each do |d|
        next if d.equal?(except) && !(fd && fd.equal?(d))
        forced = fd && fd.equal?(d)
        if variant_level?(d)
          vdefs << [d, forced ? fvals : nil] if forced || active?(d)
        else
          return false unless product_ok?(p, d, forced ? fvals : nil)
        end
      end
      return true if vdefs.empty?
      p.variants.any? { |v| vdefs.all? { |d, vals| variant_ok?(v, d, vals) } }
    end

    def filtered(except: nil)
      base_products.select { |p| match?(p, except: except) }
    end

    # number of products shown when value `val` of filter d is selected (d's other values ignored)
    def count_for(d, val)
      base_products.count { |p| match?(p, except: d, force: [d, [val]]) }
    end

    def products
      @products ||= filtered
    end

    # variant.matched: the variant satisfies every active variant-level filter
    def variant_matches?(v)
      defs.all? { |d| !variant_level?(d) || !active?(d) || variant_ok?(v, d) }
    end

    def any_active?
      defs.any? { |d| d[:kind] == :price ? price_bounds.any? : !active_values(d).empty? }
    end

    def filter_drops
      defs.filter_map do |d|
        drop = FilterDrop.new(rc, self, d)
        drop.values.empty? && d[:type] == 'list' ? nil : drop
      end
    end
  end

  class FilterDrop < BaseDrop
    def initialize(rc, filtering, d)
      super(rc)
      @f = filtering
      @d = d
    end

    def model_key = @d[:param]
    def label = @d[:label]
    def param_name = @d[:param]
    def type = @d[:type]
    def operator = 'OR'

    def presentation
      return 'swatch' if @d[:kind] == :option && option_values_with_swatch.any?
      'text'
    end

    def option_values_with_swatch
      @f.base_products.flat_map do |p|
        o = p.options.find { |op| op.name.casecmp?(@d[:name].to_s) }
        o ? o.values.select { |v| v.swatch_color || v.swatch_image } : []
      end
    end

    def values
      @values ||= case @d[:kind]
                  when :availability
                    [['1', rc.tr_default('in_stock')], ['0', rc.tr_default('out_of_stock')]]
                      .map { |val, lbl| FilterValueDrop.new(rc, self, @f, @d, val, lbl, @f.count_for(@d, val)) }
                  when :price then []
                  else
                    all_vals = @f.base_products.flat_map { |p| @f.product_values(p, @d) }.uniq
                    all_vals = sort_values(all_vals)
                    all_vals.map { |val| FilterValueDrop.new(rc, self, @f, @d, val, val, @f.count_for(@d, val)) }
                  end
    end

    def sort_values(vals)
      return vals unless @d[:kind] == :option
      order = []
      @f.base_products.each do |p|
        o = p.options.find { |op| op.name.casecmp?(@d[:name]) }
        o&.values&.each { |ov| order << ov.name unless order.include?(ov.name) }
      end
      vals.sort_by { |v| order.index(v) || 9999 }
    end

    def active_values = values.select(&:active)
    def inactive_values = values.reject(&:active)

    def min_value
      lo, = @f.price_bounds
      PriceRangeValueDrop.new(rc, "#{@d[:param]}.gte", lo)
    end

    def max_value
      _, hi = @f.price_bounds
      PriceRangeValueDrop.new(rc, "#{@d[:param]}.lte", hi)
    end

    def range_max
      @f.base_products.flat_map { |p| p.variants.map(&:price) }.max.to_i
    end

    def url_to_remove
      rc.url_with_params(remove: ->(k, _v) { k.start_with?(@d[:param]) }, remove_page: true)
    end

    def false_value = values.find { |v| v.value == '0' }
    def true_value = values.find { |v| v.value == '1' }
  end

  class PriceRangeValueDrop < BaseDrop
    def initialize(rc, param, cents)
      super(rc)
      @param = param
      @cents = cents
    end

    def model_key = @param
    def param_name = @param
    def value = @cents
    def to_s = @cents.to_s
  end

  class FilterValueDrop < BaseDrop
    def initialize(rc, filter, filtering, d, value, label, count)
      super(rc)
      @filter = filter
      @f = filtering
      @d = d
      @value = value.to_s
      @label = label.to_s
      @count = count
    end

    def model_key = [@d[:param], @value]
    def label = @label
    def value = @value
    def count = @count
    def param_name = @d[:param]
    def active = @f.active_values(@d).include?(@value)
    def to_s = @label

    def url_to_add
      rc.url_with_params(add: [[@d[:param], @value]], remove_page: true)
    end

    def url_to_remove
      rc.url_with_params(remove: ->(k, v) { k == @d[:param] && v == @value }, remove_page: true)
    end

    def swatch
      return nil unless @d[:kind] == :option
      @f.base_products.each do |p|
        o = p.options.find { |op| op.name.casecmp?(@d[:name]) }
        ov = o&.values&.find { |x| x.name == @value }
        return SwatchDrop.new(rc, ov) if ov && (ov.swatch_color || ov.swatch_image)
      end
      nil
    end

    def image = nil
  end

  class CollectionDrop < BaseDrop
    attr_reader :c

    def initialize(rc, collection, main: false)
      super(rc)
      @c = collection
      @main = main
    end

    def model_key = @c.id
    def id = @c.id
    def handle = @c.handle
    def title = @c.title
    def url
      q = @c.raw && @c.raw['q']
      rc.localize(q ? "/collections/#{@c.handle}?q=#{Util.url_encode(q)}" : "/collections/#{@c.handle}")
    end

    def description = @c.body_html
    def template_suffix = @c.template_suffix
    def published_at = @c.published_at
    def metafields = MetafieldsDrop.new(rc, @c.metafields)
    def image = (@c.image && rc.image_drop(@c.image))
    def object_type = 'collection'
    def to_s = @c.title

    def featured_image
      return image if @c.image
      (fp = @c.products.find { |p| !p.images.empty? }) && rc.image_drop(fp.images.first)
    end

    def main? = @main

    def filtering
      @filtering ||= ProductFiltering.new(rc, @c.products, rc.store.filters_config, apply_params: @main)
    end

    def sort_by = (@main ? rc.query_param('sort_by') : nil).to_s.then { |s| s.empty? ? nil : s }
    def default_sort_by = rc.store.normalize_sort(@c.sort_order)

    def sorted_filtered
      @sorted_filtered ||= rc.store.sort_products(filtering.products, sort_by || default_sort_by, @c)
    end

    def products
      @products ||= PaginatedArray.build(sorted_filtered.map { |p| rc.product_drop(p) })
    end

    def products_count = sorted_filtered.size
    def all_products_count = @c.products.size
    def filters = filtering.filter_drops
    def all_tags = @c.products.flat_map(&:tags).uniq.sort
    def tags = sorted_filtered.flat_map(&:tags).uniq.sort
    def all_types = @c.products.map(&:product_type).uniq.sort
    def all_vendors = @c.products.map(&:vendor).uniq.sort
    def current_type = @c.raw && @c.raw['current_type']
    def current_vendor = @c.raw && @c.raw['current_vendor']

    def sort_options
      rc.collection_sort_options
    end

    def next_product
      i = rc.main_product && @c.products.index(rc.main_product)
      i && (p = @c.products[i + 1]) ? rc.product_drop(p) : nil
    end

    def previous_product
      i = rc.main_product && @c.products.index(rc.main_product)
      i && i.positive? && (p = @c.products[i - 1]) ? rc.product_drop(p) : nil
    end

    def as_json
      {
        'id' => @c.id, 'handle' => @c.handle, 'title' => @c.title, 'updated_at' => rc.iso(@c.published_at),
        'body_html' => @c.body_html, 'published_at' => rc.iso(@c.published_at), 'sort_order' => @c.sort_order,
        'template_suffix' => @c.template_suffix, 'published_scope' => 'web',
        'image' => image ? { 'alt' => image.alt, 'src' => image.url, 'width' => image.width, 'height' => image.height } : nil
      }
    end
  end

  class CollectionsDrop < BaseDrop
    def liquid_method_missing(handle)
      c = rc.store.collection(handle.to_s)
      c && rc.collection_drop(c)
    end

    def key?(_k) = true
    def each(&) = list.each(&)
    def list = rc.store.collections.map { |c| rc.collection_drop(c) }
    def all = (c = rc.store.collection('all')) && rc.collection_drop(c)
    def size = rc.store.collections.size
    def first = list.first
    def last = list.last
    def to_a = list
  end

  class AllProductsDrop < BaseDrop
    def liquid_method_missing(handle)
      p = rc.store.product(handle.to_s)
      p && rc.product_drop(p)
    end

    def size = rc.store.products.size
    def first = (p = rc.store.products.first) && rc.product_drop(p)
    def each(&) = rc.store.products.map { |p| rc.product_drop(p) }.first(50).each(&)
  end
end
