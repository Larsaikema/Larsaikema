# frozen_string_literal: true

require 'securerandom'

module Preview
  class CartError < StandardError
    attr_reader :status, :description

    def initialize(message, description, status = 422)
      super(message)
      @description = description
      @status = status
    end
  end

  class CartLine
    attr_accessor :variant_id, :quantity, :properties, :selling_plan, :key, :added_at
  end

  # In-memory carts keyed by the `cart` cookie token.
  class Cart
    attr_accessor :token, :lines, :note, :attributes, :updated_at, :discount_codes

    def initialize(token)
      @token = token
      @lines = []
      @note = ''
      @attributes = {}
      @discount_codes = []
      @updated_at = Time.now
    end

    def self.line_key(variant_id, properties)
      props = (properties || {}).reject { |_k, v| v.nil? || v.to_s.empty? }
      digest = props.empty? ? Digest::MD5.hexdigest(variant_id.to_s) : Digest::MD5.hexdigest(JSON.generate(props.sort.to_h))
      "#{variant_id}:#{digest}"
    end

    def item_count = @lines.sum(&:quantity)

    def find_line(id_or_key)
      s = id_or_key.to_s
      if s.include?(':')
        @lines.find { |l| l.key == s }
      else
        @lines.find { |l| l.variant_id.to_s == s }
      end
    end

    # returns the CartLine that received the quantity
    def add(store, variant_id, quantity, properties = {}, selling_plan = nil)
      v = store.variant(variant_id)
      raise CartError.new('Cart Error', 'Het product kan niet worden gevonden.', 404) unless v
      quantity = quantity.to_i
      quantity = 1 if quantity <= 0
      properties = (properties || {}).reject { |_k, val| val.nil? || val.to_s.empty? }
      key = Cart.line_key(v.id, properties)
      line = @lines.find { |l| l.key == key }
      existing = @lines.select { |l| l.variant_id == v.id }.sum(&:quantity)
      unless v.available?
        raise CartError.new('Cart Error', "#{v.product.title}#{v.product.has_only_default_variant? ? '' : " - #{v.title}"} is uitverkocht.")
      end
      if v.inventory_management && v.inventory_policy != 'continue' && existing + quantity > v.inventory_quantity
        avail = v.inventory_quantity - existing
        if avail <= 0
          raise CartError.new('Cart Error', "Je kunt niet meer #{v.product.title}#{v.product.has_only_default_variant? ? '' : " - #{v.title}"} aan je winkelwagen toevoegen.")
        end
        quantity = avail
      end
      max = v.quantity_rule['max']
      quantity = [quantity, max.to_i - existing].min if max && max.to_i.positive?
      if line
        line.quantity += quantity
      else
        line = CartLine.new
        line.variant_id = v.id
        line.quantity = quantity
        line.properties = properties
        line.selling_plan = selling_plan
        line.key = key
        line.added_at = Time.now
        @lines.unshift(line)
      end
      @updated_at = Time.now
      line
    end

    def change(store, line_index: nil, id: nil, quantity: nil, properties: nil)
      line = line_index ? @lines[line_index.to_i - 1] : find_line(id)
      raise CartError.new('Cart Error', 'Ongeldige regel.', 400) unless line
      line.properties = properties if properties
      if quantity
        q = quantity.to_i
        if q <= 0
          @lines.delete(line)
        else
          v = store.variant(line.variant_id)
          if v&.inventory_management && v.inventory_policy != 'continue' && q > v.inventory_quantity
            q = v.inventory_quantity
          end
          line.quantity = q
        end
      end
      @updated_at = Time.now
      line
    end

    def clear
      @lines = []
      @note = ''
      @attributes = {}
      @updated_at = Time.now
    end
  end

  class CartStore
    def initialize
      @carts = {}
      @mutex = Mutex.new
    end

    def fetch(token)
      @mutex.synchronize do
        if token && @carts[token]
          @carts[token]
        else
          t = token && token.match?(/\A[\w-]{8,}\z/) ? token : "c1-#{SecureRandom.hex(16)}"
          @carts[t] ||= Cart.new(t)
        end
      end
    end
  end
end
