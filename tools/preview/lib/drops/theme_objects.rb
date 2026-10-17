# frozen_string_literal: true

module Preview
  # settings object for theme / section / block settings. Values are typed lazily according to the schema.
  class SettingsDrop < BaseDrop
    attr_reader :raw, :defs

    def initialize(rc, raw, defs)
      super(rc)
      @raw = raw || {}
      @defs = defs || {}
      @cache = {}
    end

    def model_key = object_id

    def key?(_k) = true

    def liquid_method_missing(key)
      fetch(key.to_s)
    end

    def fetch(key)
      return @cache[key] if @cache.key?(key)
      d = @defs[key]
      raw = @raw.key?(key) ? @raw[key] : d&.fetch('default', nil)
      dynamic = raw.is_a?(String) && raw.include?('{{')
      v = rc.coerce_setting(d && d['type'], raw, @context, d)
      @cache[key] = v unless dynamic
      v
    end

    def [](key) = fetch(key.to_s)
    def invoke_drop(key) = fetch(key.to_s)
    def to_h = (@defs.keys | @raw.keys).to_h { |k| [k, fetch(k)] }
    def to_s = ''
    def as_json = to_h.transform_values { |v| v.respond_to?(:as_json) && !v.is_a?(String) ? (v.is_a?(BaseDrop) ? v.to_s : v) : v }
  end

  # Dawn: settings.color_schemes / section.settings.color_scheme
  class ColorSchemeDrop < BaseDrop
    def initialize(rc, id, settings_raw, defs)
      super(rc)
      @id = id
      @raw = settings_raw || {}
      @defs = defs
    end

    def model_key = @id
    def id = @id
    def settings = SettingsDrop.new(rc, @raw, @defs)
    def to_s = @id.to_s
  end

  class ColorSchemeGroupDrop < BaseDrop
    def initialize(rc, raw, defs)
      super(rc)
      @raw = raw || {}
      @defs = defs
    end

    def model_key = 'color_schemes'
    def schemes = @raw.map { |id, h| ColorSchemeDrop.new(rc, id, h['settings'], @defs) }
    def each(&) = schemes.each(&)
    def size = @raw.size
    def first = schemes.first
    def last = schemes.last
    def to_a = schemes

    def liquid_method_missing(id)
      h = @raw[id.to_s]
      h ? ColorSchemeDrop.new(rc, id.to_s, h['settings'], @defs) : nil
    end
  end

  # Horizon 4: settings.color_palette (background, foreground, color1...)
  class ColorPaletteDrop < BaseDrop
    def initialize(rc, raw)
      super(rc)
      @raw = raw || {}
    end

    def model_key = 'color_palette'
    def colors = @raw.values.map { |v| ColorDrop.parse(v) }.compact
    def each(&) = colors.each(&)
    def size = @raw.size
    def first = colors.first
    def last = colors.last
    def to_a = colors
    def liquid_method_missing(k) = ColorDrop.parse(@raw[k.to_s])
    def background = ColorDrop.parse(@raw['background'])
    def foreground = ColorDrop.parse(@raw['foreground'])
    def to_s = ''
  end

  class SectionDrop < BaseDrop
    attr_reader :sid, :type, :data, :schema, :index, :location

    def initialize(rc, sid, type, data, schema, index: nil, location: 'template')
      super(rc)
      @sid = sid
      @type = type
      @data = data || {}
      @schema = schema || {}
      @index = index
      @location = location
    end

    def model_key = @sid
    def id = @sid
    def index0 = @index ? @index - 1 : nil
    def name = @schema['name']
    def shopify_attributes = ''

    def settings
      @settings ||= SettingsDrop.new(rc, @data['settings'], rc.setting_defs(@schema['settings']))
    end

    def block_order = (@data['block_order'] || (@data['blocks'] || {}).keys.reject { |k| @data['blocks'][k]['static'] })

    def blocks
      @blocks ||= block_order.filter_map do |bid|
        b = (@data['blocks'] || {})[bid]
        next unless b
        next if b['disabled']
        rc.block_drop(bid, b, self, nil)
      end
    end

    def blocks_data = @data['blocks'] || {}
    def to_s = @sid
  end

  class BlockDrop < BaseDrop
    attr_reader :bid, :data, :section, :parent, :schema

    def initialize(rc, bid, data, section, parent, schema)
      super(rc)
      @bid = bid
      @data = data || {}
      @section = section
      @parent = parent
      @schema = schema || {}
    end

    def model_key = [@section&.sid, @bid]
    def id = @id ||= (rc.theme.block_file?(type.to_s) ? rc.theme_block_id(@section, @bid) : @bid)
    def key = @bid
    def type = @data['type']
    def name = @data['name'] || @schema['name']
    def shopify_attributes = ''
    def static? = @data['static'] ? true : false

    def settings
      @settings ||= SettingsDrop.new(rc, @data['settings'], rc.setting_defs(@schema['settings']))
    end

    def block_order = (@data['block_order'] || (@data['blocks'] || {}).keys.reject { |k| @data['blocks'][k]['static'] })

    def blocks
      @blocks ||= block_order.filter_map do |cid|
        b = (@data['blocks'] || {})[cid]
        next unless b
        next if b['disabled']
        rc.block_drop(cid, b, @section, self)
      end
    end

    def blocks_data = @data['blocks'] || {}
    def to_s = @bid
  end
end
