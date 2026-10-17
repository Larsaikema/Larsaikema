# frozen_string_literal: true

module Preview
  class CartDrop < BaseDrop
    def initialize(rc, cart)
      super(rc)
      @cart = cart
    end

    def model_key = @cart.token
    def cart = @cart
    def valid_lines = @cart.lines.select { |l| rc.store.variant(l.variant_id) }

    def items
      @items ||= valid_lines.each_with_index.map { |l, i| LineItemDrop.new(rc, l, i) }
    end

    def item_count = valid_lines.sum(&:quantity)
    def items_count = item_count
    def total_price = items.sum(&:final_line_price)
    def original_total_price = items.sum(&:original_line_price)
    def items_subtotal_price = total_price
    def total_discount = 0
    def total_weight = items.sum { |i| i.variant_model.weight * i.quantity }
    def note = @cart.note
    def attributes = @cart.attributes
    def requires_shipping = items.any?(&:requires_shipping)
    def currency = rc.currency_drop
    def cart_level_discount_applications = []
    def discount_applications = []
    def discount_codes = []
    def checkout_charge_amount = total_price
    def taxes_included = rc.store.shop['taxes_included'] ? true : false
    def duties_included = false
    def empty? = items.empty?
    def id = @cart.token
    def token = @cart.token
    def to_s = ''

    def as_json
      {
        'token' => @cart.token, 'note' => @cart.note, 'attributes' => @cart.attributes,
        'original_total_price' => original_total_price, 'total_price' => total_price, 'total_discount' => 0,
        'total_weight' => total_weight, 'item_count' => item_count, 'items' => items.map(&:as_json),
        'requires_shipping' => requires_shipping, 'currency' => rc.store.shop['currency'],
        'items_subtotal_price' => items_subtotal_price, 'cart_level_discount_applications' => [],
        'discount_codes' => []
      }
    end
  end

  class LineItemDrop < BaseDrop
    attr_reader :line

    def initialize(rc, line, index)
      super(rc)
      @line = line
      @index = index
    end

    def model_key = @line.key
    def variant_model = rc.store.variant(@line.variant_id)
    def product_model = variant_model.product
    def key = @line.key
    def id = @line.variant_id
    def variant_id = @line.variant_id
    def product_id = product_model.id
    def product = rc.product_drop(product_model)
    def variant = rc.variant_drop(variant_model)
    def quantity = @line.quantity
    def price = variant_model.price
    def final_price = price
    def original_price = price
    def line_price = final_line_price
    def final_line_price = price * quantity
    def original_line_price = price * quantity
    def compare_at_price = variant_model.compare_at_price
    def total_discount = 0
    def discounts = []
    def discount_allocations = []
    def line_level_discount_allocations = []
    def line_level_total_discount = 0
    def properties = @line.properties || {}
    def selling_plan_allocation = nil
    def item_components = []
    def has_components? = false
    def gift_card = product_model.gift_card
    def requires_shipping = variant_model.requires_shipping
    def taxable = variant_model.taxable
    def sku = variant_model.sku
    def vendor = product_model.vendor
    def unit_price = nil
    def unit_price_measurement = nil
    def url = "/products/#{product_model.handle}?variant=#{variant_model.id}"
    def url_to_remove = "/cart/change?line=#{@index + 1}&quantity=0"
    def message = nil
    def options_with_values = product_model.has_only_default_variant? ? [] : product_model.options.each_with_index.map { |o, i| { 'name' => o.name, 'value' => variant_model.options[i] } }
    def title = product_model.has_only_default_variant? ? product_model.title : "#{product_model.title} - #{variant_model.title}"
    def fulfillment = nil
    def successfully_fulfilled_quantity = 0
    def parent_relationship = nil
    def instructions = nil
    def quantity_rule = variant_model.quantity_rule
    def object_type = 'line_item'
    def index = @index

    def image
      img = variant_model.image || product_model.images.first
      img && rc.image_drop(img)
    end

    def as_json
      img = image
      {
        'id' => id, 'properties' => properties, 'quantity' => quantity, 'variant_id' => variant_id, 'key' => key,
        'title' => title, 'price' => price, 'original_price' => price, 'presentment_price' => price / 100.0,
        'discounted_price' => price, 'line_price' => final_line_price, 'original_line_price' => original_line_price,
        'total_discount' => 0, 'discounts' => [], 'sku' => sku, 'grams' => variant_model.weight, 'vendor' => vendor,
        'taxable' => taxable, 'product_id' => product_id, 'product_has_only_default_variant' => product_model.has_only_default_variant?,
        'gift_card' => gift_card, 'final_price' => price, 'final_line_price' => final_line_price, 'url' => url,
        'featured_image' => img ? { 'aspect_ratio' => img.aspect_ratio, 'alt' => img.alt, 'height' => img.height, 'url' => img.src, 'width' => img.width } : nil,
        'image' => img&.src, 'handle' => product_model.handle, 'requires_shipping' => requires_shipping,
        'product_type' => product_model.product_type, 'product_title' => product_model.title,
        'product_description' => Util.strip_html(product_model.body_html),
        'variant_title' => product_model.has_only_default_variant? ? nil : variant_model.title,
        'variant_options' => variant_model.options, 'options_with_values' => options_with_values,
        'line_level_discount_allocations' => [], 'line_level_total_discount' => 0,
        'quantity_rule' => variant_model.quantity_rule, 'has_components' => false
      }
    end
  end
end
