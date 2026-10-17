# frozen_string_literal: true

module Preview
  # Discount codes from the fixture's `discounts` list, computed like Shopify's cart:
  #  - target_selection 'all'      → order-level ("cart level"), allocated across lines; lowers cart.total_price
  #  - target_selection 'entitled' → line-level on lines whose product is entitled (products / collections);
  #                                  lowers line_item.final_price / final_line_price
  #  - target_type 'shipping_line' → applicable, but nothing to allocate in the cart (shipping is priced at checkout)
  # Unknown codes, or codes whose minimum subtotal / entitlement is not met, are reported as applicable: false.
  class DiscountEngine
    Result = Struct.new(:codes, :applications, :line_allocations)

    def self.compute(store, cart, lines)
      line_allocs = Hash.new { |h, k| h[k] = [] }
      apps = []
      codes = []
      original = lines.sum { |l| l[:price] * l[:qty] }
      # line-level first, then order-level on the discounted subtotal (Shopify's order of application)
      defs = cart.discount_codes.map { |c| [c, store.discount(c)] }
      ordered = defs.sort_by { |_c, d| d && d['target_selection'].to_s == 'entitled' ? 0 : 1 }
      applicable = {}
      ordered.each do |code, d|
        applicable[code] = false
        next unless d
        next if d['minimum_subtotal'] && original < d['minimum_subtotal'].to_i
        next if d['minimum_quantity'] && lines.sum { |l| l[:qty] } < d['minimum_quantity'].to_i
        if d['target_type'].to_s == 'shipping_line' || d['value_type'].to_s == 'free_shipping'
          applicable[code] = true unless lines.empty?
          next
        end
        entitled = d['target_selection'].to_s == 'entitled'
        targets = entitled ? lines.select { |l| entitled?(store, d, l) } : lines
        next if targets.empty?
        app = build_app(d, code, entitled)
        amounts = allocate(d, targets, line_allocs, entitled)
        next if amounts.values.sum <= 0
        amounts.each { |key, amt| line_allocs[key] << [app, amt] }
        app['total_allocated_amount'] = amounts.values.sum
        apps << app
        applicable[code] = true
      end
      cart.discount_codes.each { |c| codes << { 'code' => c, 'applicable' => applicable[c] ? true : false } }
      Result.new(codes, apps, line_allocs)
    end

    def self.entitled?(store, d, line)
      p = line[:product]
      return true if Array(d['entitled_products']).map(&:to_s).include?(p.handle)
      return true if Array(d['entitled_variants']).map(&:to_s).include?(line[:variant_id].to_s)
      Array(d['entitled_collections']).any? { |h| (c = store.collection(h)) && c.products.include?(p) }
    end

    def self.build_app(d, code, entitled)
      fixed = d['value_type'].to_s == 'fixed_amount'
      {
        'type' => 'discount_code', 'key' => "discount_code_#{code.downcase}", 'title' => code, 'description' => d['title'] || code,
        'value' => fixed ? format('%.1f', d['value'].to_i / 100.0) : format('%.1f', d['value'].to_f),
        'value_type' => fixed ? 'fixed_amount' : 'percentage',
        'allocation_method' => d['allocation_method'] || (entitled && fixed ? 'each' : 'across'),
        'target_selection' => entitled ? 'entitled' : 'all', 'target_type' => 'line_item', 'total_allocated_amount' => 0
      }
    end

    # amount per line key; never more than what is left on the line after earlier discounts
    def self.allocate(d, targets, line_allocs, entitled)
      left = targets.to_h { |l| [l[:key], [l[:price] * l[:qty] - line_allocs[l[:key]].sum { |_a, x| x }, 0].max] }
      base = left.values.sum
      return {} if base <= 0
      if d['value_type'].to_s == 'fixed_amount'
        if entitled && (d['allocation_method'] || 'each') == 'each'
          return targets.to_h { |l| [l[:key], [d['value'].to_i * l[:qty], left[l[:key]]].min] }
        end
        total = [d['value'].to_i, base].min
      else
        total = (base * d['value'].to_f / 100.0).round
      end
      # proportional allocation, remainder on the last line (Shopify allocates the rounding cent too)
      out = {}
      acc = 0
      targets.each_with_index do |l, i|
        amt = i == targets.size - 1 ? total - acc : (total * left[l[:key]].to_f / base).floor
        amt = [[amt, 0].max, left[l[:key]]].min
        out[l[:key]] = amt
        acc += amt
      end
      out
    end
  end

  class DiscountApplicationDrop < BaseDrop
    attr_reader :h

    def initialize(rc, h)
      super(rc)
      @h = h
    end

    def model_key = @h['key']
    def type = @h['type']
    def title = @h['title']
    def value = @h['value'].to_f
    def value_type = @h['value_type']
    def target_selection = @h['target_selection']
    def target_type = @h['target_type']
    def allocation_method = @h['allocation_method']
    def total_allocated_amount = @h['total_allocated_amount']
    def to_s = @h['title'].to_s
    def as_json = @h
  end

  class DiscountAllocationDrop < BaseDrop
    def initialize(rc, app, amount)
      super(rc)
      @app = app
      @amount = amount
    end

    def model_key = [@app.model_key, object_id]
    def amount = @amount
    def discount_application = @app
    def as_json = { 'amount' => @amount, 'discount_application' => @app.as_json }
  end

  class CartDrop < BaseDrop
    def initialize(rc, cart)
      super(rc)
      @cart = cart
    end

    def model_key = @cart.token
    def cart = @cart
    def valid_lines = @cart.lines.select { |l| rc.store.variant(l.variant_id) }

    def items
      @items ||= valid_lines.each_with_index.map { |l, i| LineItemDrop.new(rc, l, i, self) }
    end

    def discounts
      @discounts ||= begin
        lines = valid_lines.map do |l|
          v = rc.store.variant(l.variant_id)
          { key: l.key, price: v.price, qty: l.quantity, product: v.product, variant_id: v.id }
        end
        r = DiscountEngine.compute(rc.store, @cart, lines)
        drops = r.applications.to_h { |a| [a['key'], DiscountApplicationDrop.new(rc, a)] }
        allocs = r.line_allocations.transform_values { |list| list.map { |a, amt| DiscountAllocationDrop.new(rc, drops[a['key']], amt) } }
        { codes: r.codes, apps: drops.values, allocs: allocs }
      end
    end

    def allocations_for(key) = discounts[:allocs][key] || []

    def item_count = valid_lines.sum(&:quantity)
    def items_count = item_count
    def original_total_price = items.sum(&:original_line_price)
    def items_subtotal_price = items.sum(&:final_line_price)
    def cart_level_discount_applications = discounts[:apps].select { |a| a.target_selection == 'all' }
    def discount_applications = discounts[:apps]
    def cart_level_discount_total = cart_level_discount_applications.sum(&:total_allocated_amount)
    def total_price = [items_subtotal_price - cart_level_discount_total, 0].max
    def total_discount = original_total_price - total_price
    def total_weight = items.sum { |i| i.variant_model.weight * i.quantity }
    def note = @cart.note
    def attributes = @cart.attributes
    def requires_shipping = items.any?(&:requires_shipping)
    def currency = rc.currency_drop
    def discount_codes = discounts[:codes]
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
        'original_total_price' => original_total_price, 'total_price' => total_price, 'total_discount' => total_discount,
        'total_weight' => total_weight, 'item_count' => item_count, 'items' => items.map(&:as_json),
        'requires_shipping' => requires_shipping, 'currency' => rc.store.shop['currency'],
        'items_subtotal_price' => items_subtotal_price,
        'cart_level_discount_applications' => cart_level_discount_applications.map(&:as_json),
        'discount_codes' => discount_codes
      }
    end
  end

  class LineItemDrop < BaseDrop
    attr_reader :line

    def initialize(rc, line, index, cart_drop = nil)
      super(rc)
      @line = line
      @index = index
      @cart_drop = cart_drop
    end

    # every allocation on this line (line-level + its share of order-level discounts)
    def discount_allocations = @cart_drop ? @cart_drop.allocations_for(@line.key) : []
    def line_level_discount_allocations = discount_allocations.select { |a| a.discount_application.target_selection != 'all' }
    def line_level_total_discount = line_level_discount_allocations.sum(&:amount)

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
    def final_price = quantity.positive? ? final_line_price / quantity : price
    def original_price = price
    def line_price = final_line_price
    def final_line_price = price * quantity - line_level_total_discount
    def original_line_price = price * quantity
    def compare_at_price = variant_model.compare_at_price
    def total_discount = discount_allocations.sum(&:amount)
    def discounts = discount_allocations.map(&:discount_application)
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
    def url = rc.localize("/products/#{product_model.handle}?variant=#{variant_model.id}")
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
        'discounted_price' => final_price, 'line_price' => final_line_price, 'original_line_price' => original_line_price,
        'total_discount' => total_discount,
        'discounts' => discount_allocations.map { |a| { 'amount' => a.amount, 'title' => a.discount_application.title } }, 'sku' => sku, 'grams' => variant_model.weight, 'vendor' => vendor,
        'taxable' => taxable, 'product_id' => product_id, 'product_has_only_default_variant' => product_model.has_only_default_variant?,
        'gift_card' => gift_card, 'final_price' => final_price, 'final_line_price' => final_line_price, 'url' => url,
        'featured_image' => img ? { 'aspect_ratio' => img.aspect_ratio, 'alt' => img.alt, 'height' => img.height, 'url' => img.url, 'width' => img.width } : nil,
        'image' => img&.url, 'handle' => product_model.handle, 'requires_shipping' => requires_shipping,
        'product_type' => product_model.product_type, 'product_title' => product_model.title,
        'product_description' => Util.strip_html(product_model.body_html),
        'variant_title' => product_model.has_only_default_variant? ? nil : variant_model.title,
        'variant_options' => variant_model.options, 'options_with_values' => options_with_values,
        'line_level_discount_allocations' => line_level_discount_allocations.map(&:as_json),
        'line_level_total_discount' => line_level_total_discount,
        'quantity_rule' => variant_model.quantity_rule, 'has_components' => false
      }
    end
  end
end
