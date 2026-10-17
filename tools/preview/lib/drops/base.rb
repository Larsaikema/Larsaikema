# frozen_string_literal: true

module Preview
  # Base class for all Shopify object drops. Holds the request context (rc).
  class BaseDrop < Liquid::Drop
    attr_reader :rc

    def initialize(rc)
      super()
      @rc = rc
    end

    def model_key = object_id

    # Unknown property: nil like Shopify, but recorded so missing drop fields can be found (see X-Preview-Unknown-Props).
    def liquid_method_missing(name)
      @rc&.note_unknown_prop(self.class.name.split('::').last, name)
      nil
    end

    def ==(other)
      other.class == self.class && other.model_key == model_key
    end

    def eql?(other) = self == other
    def hash = [self.class, model_key].hash

    # JSON representation used by the json filter (override)
    def as_json = {}

    def inspect = "#<#{self.class.name} #{model_key}>"
  end

  # Array subclass so Liquid treats it as a normal array; paginate swaps its contents for one page.
  class PaginatedArray < Array
    attr_accessor :all_items, :paginated, :default_limit

    def self.build(items, default_limit: 50)
      a = new(items.first(default_limit))
      a.all_items = items
      a.default_limit = default_limit
      a
    end

    def total = all_items.size

    def paginate!(offset, limit)
      replace(all_items[offset, limit] || [])
      self.paginated = true
    end

    def unpaginate!
      replace(all_items.first(default_limit))
      self.paginated = false
    end
  end

  # ---------------------------------------------------------------------------
  # Metafields
  # ---------------------------------------------------------------------------
  class MetafieldsDrop < BaseDrop
    def initialize(rc, map)
      super(rc)
      @map = map || {}
    end

    def liquid_method_missing(ns)
      MetafieldNamespaceDrop.new(rc, ns.to_s, @map)
    end

    def key?(_k) = true
    def to_s = ''
    def blank? = @map.empty?
    def empty? = @map.empty?
  end

  class MetafieldNamespaceDrop < BaseDrop
    def initialize(rc, ns, map)
      super(rc)
      @ns = ns
      @map = map
    end

    def liquid_method_missing(key)
      mf = @map["#{@ns}.#{key}"]
      mf ? MetafieldDrop.new(rc, mf) : nil
    end

    def blank? = @map.keys.none? { |k| k.start_with?("#{@ns}.") }
    def empty? = blank?
    def to_s = ''
  end

  class MetafieldDrop < BaseDrop
    attr_reader :mf

    def initialize(rc, mf)
      super(rc)
      @mf = mf
    end

    def model_key = [@mf.namespace, @mf.key, @mf.owner_type]
    def type = @mf.type
    def namespace = @mf.namespace
    def key = @mf.key
    def list? = @mf.type.start_with?('list.')

    def value
      @value ||= convert(@mf.type, @mf.value)
    end

    def convert(type, raw)
      if type.start_with?('list.')
        arr = raw.is_a?(Array) ? raw : (JSON.parse(raw) rescue [raw])
        return arr.map { |x| convert(type.sub('list.', ''), x.is_a?(String) ? x : JSON.generate(x)) }.compact
      end
      case type
      when 'number_integer' then raw.to_i
      when 'number_decimal' then raw.to_f
      when 'boolean' then Util.to_bool(raw)
      when 'color' then ColorDrop.parse(raw)
      when 'json', 'rich_text_field' then (JSON.parse(raw) rescue raw)
      when 'date', 'date_time' then raw.to_s
      when 'dimension', 'weight', 'volume'
        d = (JSON.parse(raw) rescue {})
        MeasurementDrop.new(rc, d, type)
      when 'rating'
        d = (JSON.parse(raw) rescue {})
        RatingDrop.new(rc, d)
      when 'money'
        d = (JSON.parse(raw) rescue {})
        (d['amount'].to_f * 100).round
      when 'product_reference' then (p = rc.store.product(ref_handle(raw)) || rc.store.product_by_id(ref_id(raw))) && rc.product_drop(p)
      when 'collection_reference' then (c = rc.store.collection(ref_handle(raw))) && rc.collection_drop(c)
      when 'page_reference' then (pg = rc.store.page(ref_handle(raw))) && rc.page_drop(pg)
      when 'variant_reference' then (v = rc.store.variant(ref_id(raw))) && rc.variant_drop(v)
      when 'file_reference'
        rc.image_drop(StoreImage.new(rc.store, { 'src' => raw.to_s.sub(%r{\Ashopify://shop_images/}, '') }, 'file'))
      when 'metaobject_reference', 'mixed_reference' then nil
      else raw
      end
    end

    def ref_handle(raw) = raw.to_s.split('/').last
    def ref_id(raw) = raw.to_s[/(\d+)\z/, 1].to_i

    def to_s
      v = value
      case v
      when Array then v.map(&:to_s).join(', ')
      when Hash then JSON.generate(v)
      else v.to_s
      end
    end

    def blank? = value.nil? || (value.respond_to?(:empty?) && value.empty?)
    def empty? = blank?
    def size = value.respond_to?(:size) ? value.size : to_s.size
    def first = value.is_a?(Array) ? value.first : nil
    def last = value.is_a?(Array) ? value.last : nil
    def as_json = value.respond_to?(:as_json) ? value.as_json : value
  end

  class MeasurementDrop < BaseDrop
    def initialize(rc, d, type)
      super(rc)
      @d = d
      @type = type
    end

    def value = @d['value']
    def unit = @d['unit']
    def type = @type
    def to_s = "#{value} #{unit}"
  end

  class RatingDrop < BaseDrop
    def initialize(rc, d)
      super(rc)
      @d = d
    end

    def value = @d['value'].to_f
    def scale_min = @d['scale_min'].to_f
    def scale_max = @d['scale_max'].to_f
    def rating = value
    def to_s = value.to_s
  end

  # ---------------------------------------------------------------------------
  # Images & media
  # ---------------------------------------------------------------------------
  class ImageDrop < BaseDrop
    attr_reader :img, :media_mode

    def initialize(rc, img, media_mode = false)
      super(rc)
      @img = img
      @media_mode = media_mode
    end

    def model_key = [@img.src, @img.id, @media_mode]

    def ==(other)
      return other.img.src == @img.src && other.img.id == @img.id if other.is_a?(ImageDrop)
      false
    end

    def base_url
      return @img.src if @img.external?
      "/cdn/images/#{Util.url_encode(@img.filename).gsub('+', '%20')}?v=#{@img.version}"
    end

    def id = @media_mode ? @img.media_id : @img.id
    def alt = @img.alt.to_s.empty? ? (@img.product&.title || '') : @img.alt
    def width = @img.width
    def height = @img.height
    def aspect_ratio = @img.aspect_ratio.round(3)
    def src = base_url
    def url = base_url
    def position = @img.position || 1
    def media_type = 'image'
    def product_id = @img.product&.id
    def preview_image = rc.image_drop(@img, false)
    def presentation = { 'focal_point' => '50.0% 50.0%' }
    def attached_to_variant? = !@img.variant_ids.empty?
    def variants = @img.variant_ids.filter_map { |vid| (v = rc.store.variant(vid)) && rc.variant_drop(v) }
    def image = self
    def media_content_type = 'IMAGE'
    def to_s = "files/#{@img.filename}"

    def as_json
      if @media_mode
        {
          'alt' => alt, 'id' => @img.media_id, 'position' => position,
          'preview_image' => { 'aspect_ratio' => aspect_ratio, 'height' => height, 'width' => width, 'src' => absolute_src },
          'aspect_ratio' => aspect_ratio, 'height' => height, 'media_type' => 'image', 'src' => absolute_src, 'width' => width
        }
      else
        {
          'id' => @img.id, 'product_id' => product_id, 'position' => position, 'created_at' => rc.iso(@img.product&.created_at),
          'updated_at' => rc.iso(@img.product&.updated_at), 'alt' => alt, 'width' => width, 'height' => height,
          'src' => absolute_src, 'variant_ids' => @img.variant_ids
        }
      end
    end

    def absolute_src = base_url
  end

  # Generic (non-image) placeholder for video settings etc.
  class VideoDrop < BaseDrop
    def initialize(rc, src)
      super(rc)
      @src = src
    end

    def alt = ''
    def aspect_ratio = 1.778
    def id = Util.stable_id("video:#{@src}", 1_000_000)
    def media_type = 'video'
    def preview_image = nil
    def sources = []
    def to_s = @src.to_s
  end
end
