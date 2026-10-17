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

    def matches?(p, d)
      case d[:kind]
      when :availability
        vals = active_values(d)
        return true if vals.empty? || vals.size > 1
        vals.first == '1' ? p.available? : !p.available?
      when :price
        lo, hi = price_bounds
        return true unless lo || hi
        p.variants.any? { |v| (lo.nil? || v.price >= lo) && (hi.nil? || v.price <= hi) }
      else
        vals = active_values(d)
        return true if vals.empty?
        (product_values(p, d) & vals).any?
      end
    end

    def filtered(except: nil)
      base_products.select { |p| defs.all? { |d| d.equal?(except) || matches?(p, d) } }
    end

    def products
      @products ||= filtered
    end

    def variant_matches?(v)
      defs.all? do |d|
        case d[:kind]
        when :option
          vals = active_values(d)
          idx = v.product.options.index { |o| o.name.casecmp?(d[:name]) }
          vals.empty? || idx.nil? || vals.include?(v.options[idx])
        when :availability
          vals = active_values(d)
          vals.size != 1 || (vals.first == '1' ? v.available? : true)
        when :price
          lo, hi = price_bounds
          (lo.nil? || v.price >= lo) && (hi.nil? || v.price <= hi)
        else true
        end
      end
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
                    others = @f.filtered(except: @d)
                    [['1', rc.tr_default('in_stock'), others.count(&:available?)],
                     ['0', rc.tr_default('out_of_stock'), others.count { |p| !p.available? }]]
                      .map { |val, lbl, cnt| FilterValueDrop.new(rc, self, @f, @d, val, lbl, cnt) }
                  when :price then []
                  else
                    others = @f.filtered(except: @d)
                    all_vals = @f.base_products.flat_map { |p| @f.product_values(p, @d) }.uniq
                    all_vals = sort_values(all_vals)
                    all_vals.map do |val|
                      cnt = others.count { |p| @f.product_values(p, @d).include?(val) }
                      FilterValueDrop.new(rc, self, @f, @d, val, val, cnt)
                    end
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
    def url = "/collections/#{@c.handle}"
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
    def current_type = nil
    def current_vendor = nil

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
        'image' => image ? { 'alt' => image.alt, 'src' => image.src, 'width' => image.width, 'height' => image.height } : nil
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
