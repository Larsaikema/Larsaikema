# frozen_string_literal: true

module Preview
  class ProductDrop < BaseDrop
    attr_reader :p

    def initialize(rc, product)
      super(rc)
      @p = product
    end

    def model_key = @p.id
    def id = @p.id
    def handle = @p.handle
    def title = @p.title
    def name = @p.title
    def url = rc.localize("/products/#{@p.handle}")
    def vendor = @p.vendor
    def type = @p.product_type
    def tags = @p.tags
    def description = @p.body_html
    def content = @p.body_html
    def price = @p.price_min
    def price_min = @p.price_min
    def price_max = @p.price_max
    def price_varies = @p.price_min != @p.price_max
    def compare_at_price = compare_at_price_min
    def compare_at_price_min = (@p.compare_at_prices.min || nil)
    def compare_at_price_max = (@p.compare_at_prices.max || nil)
    def compare_at_price_varies = (@p.compare_at_prices.uniq.size > 1)
    def available = @p.available?
    def created_at = @p.created_at
    def published_at = @p.published_at
    def updated_at = @p.updated_at
    def template_suffix = @p.template_suffix
    def gift_card? = @p.gift_card
    def requires_selling_plan = false
    def selling_plan_groups = []
    def selected_selling_plan = nil
    def selected_or_first_available_selling_plan_allocation = nil
    def quantity_price_breaks_configured? = false
    def has_only_default_variant = @p.has_only_default_variant?
    def options = @p.options.map(&:name)
    def variants_count = @p.variants.size
    def collections = @p.collections.map { |c| rc.collection_drop(c) }
    def metafields = MetafieldsDrop.new(rc, @p.metafields)
    def category = nil
    def seo = @p.seo
    def object_type = 'product'

    def variants = @p.variants.map { |v| rc.variant_drop(v) }
    def options_with_values = @p.options.map { |o| OptionDrop.new(rc, o, self) }
    def options_by_name = @p.options.to_h { |o| [o.name, OptionDrop.new(rc, o, self)] }

    def images = @p.images.map { |i| rc.image_drop(i) }
    def media = @p.images.map { |i| rc.image_drop(i, true) }
    def featured_image = (i = @p.images.first) && rc.image_drop(i)

    # Shopify: the first media item of the product (not variant dependent).
    def featured_media = (i = @p.images.first) && rc.image_drop(i, true)

    # Variant selected via ?variant= or ?option_values= (only for the requested product)
    def selected_variant_model = rc.selected_variant_for(@p)
    def selected_variant = (v = selected_variant_model) && rc.variant_drop(v)

    def selected_or_first_available_variant
      v = selected_variant_model || rc.requested_fallback_variant(@p) || @p.first_available_variant || @p.variants.first
      v && rc.variant_drop(v)
    end

    def first_available_variant = (v = @p.first_available_variant || @p.variants.first) && rc.variant_drop(v)

    def to_s = @p.title

    def as_json(js_endpoint: false)
      {
        'id' => @p.id, 'title' => @p.title, 'handle' => @p.handle, 'description' => @p.body_html,
        'published_at' => rc.iso(@p.published_at), 'created_at' => rc.iso(@p.created_at),
        'vendor' => @p.vendor, 'type' => @p.product_type, 'tags' => @p.tags,
        'price' => price, 'price_min' => price_min, 'price_max' => price_max, 'available' => available,
        'price_varies' => price_varies, 'compare_at_price' => compare_at_price,
        'compare_at_price_min' => compare_at_price_min || 0, 'compare_at_price_max' => compare_at_price_max || 0,
        'compare_at_price_varies' => compare_at_price_varies,
        'variants' => variants.map(&:as_json),
        'images' => images.map(&:url),
        'featured_image' => featured_image&.url,
        'options' => if js_endpoint
                       @p.options.map { |o| { 'name' => o.name, 'position' => o.position, 'values' => o.values.map(&:name) } }
                     else
                       @p.options.map(&:name)
                     end,
        'url' => url,
        'media' => media.map(&:as_json),
        'requires_selling_plan' => false, 'selling_plan_groups' => []
      }.tap do |h|
        h['content'] = @p.body_html unless js_endpoint
      end
    end
  end

  class VariantDrop < BaseDrop
    attr_reader :v

    def initialize(rc, variant)
      super(rc)
      @v = variant
    end

    def model_key = @v.id
    def id = @v.id
    def title = @v.title
    def name = @v.product.has_only_default_variant? ? @v.product.title : "#{@v.product.title} - #{@v.title}"
    def public_title = @v.product.has_only_default_variant? ? nil : @v.title
    def option1 = @v.options[0]
    def option2 = @v.options[1]
    def option3 = @v.options[2]

    def options = @v.options
    def sku = @v.sku
    def barcode = @v.barcode
    def price = @v.price
    def compare_at_price = @v.compare_at_price
    def available = @v.available?
    def inventory_quantity = @v.inventory_quantity
    def inventory_management = @v.inventory_management
    def inventory_policy = @v.inventory_policy
    def url = rc.localize("/products/#{@v.product.handle}?variant=#{@v.id}")
    def product = rc.product_drop(@v.product)
    def image = (@v.image && rc.image_drop(@v.image))
    def featured_image = image
    def featured_media = (@v.image && rc.image_drop(@v.image, true))
    def weight = @v.weight
    def weight_unit = @v.weight_unit
    def weight_in_unit = @v.weight_in_unit.round(2)
    def requires_shipping = @v.requires_shipping
    def taxable = @v.taxable
    def unit_price = @v.unit_price
    def unit_price_measurement = @v.unit_price_measurement
    def quantity_rule = @v.quantity_rule
    def quantity_price_breaks = []
    def metafields = MetafieldsDrop.new(rc, @v.metafields)
    def selected = rc.selected_variant_for(@v.product) == @v
    def matched = rc.variant_matched?(@v)
    def incoming = false
    def next_incoming_date = nil
    def store_availabilities = []
    def requires_selling_plan = false
    def selling_plan_allocations = []
    def position = @v.position
    def object_type = 'variant'
    def to_s = @v.title

    def as_json
      h = {
        'id' => @v.id, 'title' => @v.title, 'option1' => option1, 'option2' => option2, 'option3' => option3,
        'sku' => @v.sku, 'requires_shipping' => @v.requires_shipping, 'taxable' => @v.taxable,
        'featured_image' => image&.as_json, 'available' => available, 'name' => name, 'public_title' => public_title,
        'options' => @v.options, 'price' => @v.price, 'weight' => @v.weight, 'compare_at_price' => @v.compare_at_price,
        'inventory_management' => @v.inventory_management, 'barcode' => @v.barcode,
        'requires_selling_plan' => false, 'selling_plan_allocations' => [], 'quantity_rule' => @v.quantity_rule
      }
      h['featured_media'] = featured_media&.as_json&.slice('alt', 'id', 'position', 'preview_image')
      h
    end
  end

  class OptionDrop < BaseDrop
    def initialize(rc, option, product_drop)
      super(rc)
      @o = option
      @pd = product_drop
    end

    def model_key = [@o.product.id, @o.position]
    def name = @o.name
    def position = @o.position
    def values = @o.values.map { |ov| OptionValueDrop.new(rc, ov, self) }
    def option = @o

    def selected_value
      sel = rc.selected_option_values(@o.product)
      sel[@o.position - 1]
    end

    def to_s = @o.name
  end

  class OptionValueDrop < BaseDrop
    def initialize(rc, ov, option_drop)
      super(rc)
      @ov = ov
      @od = option_drop
    end

    def model_key = @ov.id
    def id = @ov.id
    def name = @ov.name
    def position = @ov.position
    def to_s = @ov.name
    def size = @ov.name.size
    def product_url = nil

    def ==(other)
      return other.id == id if other.is_a?(OptionValueDrop)
      other.is_a?(String) ? other == @ov.name : false
    end

    def selected
      rc.selected_option_values(@ov.option.product)[@ov.option.position - 1] == @ov.name
    end

    # Shopify: availability/existence considers the selected values of earlier options.
    def candidate_variants
      prod = @ov.option.product
      sel = rc.selected_option_values(prod)
      idx = @ov.option.position - 1
      prod.variants.select do |v|
        next false unless v.options[idx] == @ov.name
        (0...idx).all? { |i| v.options[i] == sel[i] }
      end
    end

    def available = candidate_variants.any?(&:available?)
    def exists = !candidate_variants.empty?

    def variant
      prod = @ov.option.product
      sel = rc.selected_option_values(prod).dup
      sel[@ov.option.position - 1] = @ov.name
      v = prod.variants.find { |x| x.options == sel.first(x.options.size) }
      v && rc.variant_drop(v)
    end

    def swatch
      return nil unless @ov.swatch_color || @ov.swatch_image
      SwatchDrop.new(rc, @ov)
    end

    def as_json = { 'id' => id, 'name' => name }
  end

  class SwatchDrop < BaseDrop
    def initialize(rc, ov)
      super(rc)
      @ov = ov
    end

    def model_key = @ov.id
    def color = ColorDrop.parse(@ov.swatch_color)

    def image
      return nil unless @ov.swatch_image
      rc.image_drop(StoreImage.new(rc.store, { 'src' => @ov.swatch_image, 'alt' => @ov.name }, 'swatch'))
    end

    def to_s = @ov.swatch_color.to_s
  end
end
