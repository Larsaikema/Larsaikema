# frozen_string_literal: true

require 'fileutils'

module Preview
  # Maps Shopify font-library handles (e.g. "inter_n4", "work_sans_i7") onto the vendored Google Fonts TTFs.
  module Fonts
    module_function

    GFONTS = ENV['PREVIEW_GFONTS'] ||
             '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad/vendor/gfonts/ofl'
    WEIGHT_NAMES = {
      100 => 'Thin', 200 => 'ExtraLight', 300 => 'Light', 400 => 'Regular', 500 => 'Medium', 600 => 'SemiBold',
      700 => 'Bold', 800 => 'ExtraBold', 900 => 'Black'
    }.freeze
    SYSTEM = {
      'sans-serif' => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      'serif' => 'Iowan Old Style, Apple Garamond, Baskerville, Times New Roman, serif',
      'monospace' => 'Menlo, Consolas, Monaco, Liberation Mono, monospace'
    }.freeze

    @meta = {}

    def parse_handle(handle)
      h = handle.to_s
      m = h.match(/\A(.+)_([nio])(\d)\z/)
      return nil unless m
      { family_key: m[1], style: m[2] == 'n' ? 'normal' : (m[2] == 'i' ? 'italic' : 'oblique'), weight: m[3].to_i * 100 }
    end

    def dir_for(family_key)
      k = family_key.to_s.delete('_').downcase
      d = File.join(GFONTS, k)
      File.directory?(d) ? d : nil
    end

    def meta(dir)
      return @meta[dir] if @meta.key?(dir)
      info = { 'name' => File.basename(dir).capitalize, 'category' => 'SANS_SERIF' }
      mp = File.join(dir, 'METADATA.pb')
      if File.exist?(mp)
        src = File.read(mp)
        info['name'] = src[/^name:\s*"([^"]+)"/, 1] || info['name']
        info['category'] = src[/^category:\s*"([^"]+)"/, 1] || info['category']
      end
      @meta[dir] = info
    end

    def file_for(dir, weight, style)
      files = Dir.children(dir).select { |f| f.end_with?('.ttf') }
      italic = style != 'normal'
      variable = files.select { |f| f.include?('[') }
      unless variable.empty?
        f = variable.find { |x| italic ? x.include?('Italic') : !x.include?('Italic') }
        return f if f
        return variable.first unless italic
        return nil
      end
      wname = WEIGHT_NAMES[weight] || 'Regular'
      base = files.first.to_s.split('-').first
      name = if italic
               weight == 400 ? "#{base}-Italic.ttf" : "#{base}-#{wname}Italic.ttf"
             else
               "#{base}-#{wname}.ttf"
             end
      return name if files.include?(name)
      nil
    end

    def available?(handle)
      ph = parse_handle(handle)
      return false unless ph
      dir = dir_for(ph[:family_key])
      return true unless dir # unknown family -> treat as available (falls back to system)
      !file_for(dir, ph[:weight], ph[:style]).nil?
    end

    def resolve_file(family_key, file)
      dir = dir_for(family_key)
      return nil unless dir
      p = File.join(dir, file)
      return nil unless File.file?(p)
      pinned_opsz(p) || p
    end

    # Shopify's font library serves static text cuts. The vendored Google Fonts are variable and some
    # (Inter 4, Fraunces, ...) carry an optical-size axis: with font-optical-sizing:auto every large
    # heading would switch to the tighter "Display" design. Serve a copy whose fvar opsz axis is pinned
    # to its default (min = max = default), so the browser always renders the text design.
    FONT_CACHE = ENV['PREVIEW_FONT_CACHE'] ||
                 '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad/cache/fonts'

    def pinned_opsz(path)
      return nil unless File.basename(path).include?('opsz')
      dst = File.join(FONT_CACHE, "pinned-opsz-#{File.basename(path)}")
      return dst if File.exist?(dst) && File.mtime(dst) >= File.mtime(path)
      data = pin_opsz_data(File.binread(path))
      return nil unless data
      FileUtils.mkdir_p(FONT_CACHE)
      tmp = "#{dst}.#{Process.pid}.tmp"
      File.binwrite(tmp, data)
      File.rename(tmp, dst)
      dst
    rescue StandardError => e
      warn "[preview] could not pin opsz in #{path}: #{e.message}"
      nil
    end

    def pin_opsz_data(src)
      data = src.dup.force_encoding(Encoding::BINARY)
      num_tables = data[4, 2].unpack1('n')
      tables = {}
      num_tables.times do |i|
        dir = 12 + (i * 16)
        tag, _sum, offset, length = data[dir, 16].unpack('a4NNN')
        tables[tag] = { dir: dir, offset: offset, length: length }
      end
      fv = tables['fvar'] or return nil
      base = fv[:offset]
      _maj, _min, axes_off, _res, axis_count, axis_size, inst_count, inst_size = data[base, 16].unpack('n8')
      idx = nil
      default = nil
      axis_count.times do |i|
        a = base + axes_off + (i * axis_size)
        next unless data[a, 4] == 'opsz'
        default = data[a + 8, 4].unpack1('N')
        data[a + 4, 4] = [default].pack('N')
        data[a + 12, 4] = [default].pack('N')
        idx = i
      end
      return nil unless idx
      inst_base = base + axes_off + (axis_count * axis_size)
      inst_count.times { |j| data[inst_base + (j * inst_size) + 4 + (idx * 4), 4] = [default].pack('N') }
      # table checksum of fvar + head.checkSumAdjustment
      data[fv[:dir] + 4, 4] = [table_checksum(data[base, fv[:length]])].pack('N')
      if (hd = tables['head'])
        data[hd[:offset] + 8, 4] = [0].pack('N')
        data[hd[:dir] + 4, 4] = [table_checksum(data[hd[:offset], hd[:length]])].pack('N')
        data[hd[:offset] + 8, 4] = [(0xB1B0AFBA - table_checksum(data)) & 0xFFFFFFFF].pack('N')
      end
      data
    end

    def table_checksum(bytes)
      b = bytes.b
      b += "\0" * ((4 - (b.bytesize % 4)) % 4)
      b.unpack('N*').sum & 0xFFFFFFFF
    end
  end

  class FontDrop < Liquid::Drop
    attr_reader :handle

    def self.build(handle)
      return handle if handle.is_a?(FontDrop)
      return nil if handle.nil? || handle.to_s.strip.empty?
      ph = Fonts.parse_handle(handle)
      return nil unless ph
      new(handle.to_s)
    end

    def initialize(handle)
      super()
      @handle = handle
      @ph = Fonts.parse_handle(handle)
      @dir = Fonts.dir_for(@ph[:family_key])
    end

    def family
      return Fonts.meta(@dir)['name'] if @dir
      @ph[:family_key].split('_').map(&:capitalize).join(' ')
    end

    def style = @ph[:style]
    def weight = @ph[:weight]
    def family_key = @ph[:family_key]

    def fallback_families
      cat = @dir ? Fonts.meta(@dir)['category'] : 'SANS_SERIF'
      case cat
      when 'SERIF' then 'serif'
      when 'MONOSPACE' then 'monospace'
      when 'DISPLAY', 'HANDWRITING' then 'sans-serif'
      else 'sans-serif'
      end
    end

    def baseline_ratio = 0.155
    def system? = false
    def system = false

    def variants
      [400, 700].flat_map { |w| %w[n i].map { |s| "#{@ph[:family_key]}_#{s}#{w / 100}" } }
                .select { |h| Fonts.available?(h) }.map { |h| FontDrop.new(h) }
    end

    def file
      return nil unless @dir
      Fonts.file_for(@dir, weight, style)
    end

    def url
      f = file
      return nil unless f
      "/cdn/fonts/#{@ph[:family_key]}/#{f.gsub('[', '%5B').gsub(']', '%5D').gsub(',', '%2C')}"
    end

    def modify(prop, value)
      w = weight
      s = @ph[:style]
      case prop.to_s
      when 'weight'
        v = value.to_s
        w = case v
            when 'bold' then 700
            when 'normal' then 400
            when 'bolder' then [w + 300, 900].min
            when 'lighter' then [w - 300, 100].max
            when /\A[+-]\d+\z/ then w + v.to_i
            when /\A\d+\z/ then v.to_i
            else w
            end
        return nil if w < 100 || w > 900
      when 'style'
        s = case value.to_s
            when 'italic' then 'italic'
            when 'oblique' then 'oblique'
            when 'normal' then 'normal'
            else s
            end
      else
        return self
      end
      code = { 'normal' => 'n', 'italic' => 'i', 'oblique' => 'o' }[s]
      h = "#{@ph[:family_key]}_#{code}#{w / 100}"
      Fonts.available?(h) ? FontDrop.new(h) : nil
    end

    def face(font_display = nil)
      u = url
      css = +"@font-face {\n  font-family: #{family.inspect};\n  font-weight: #{weight};\n  font-style: #{style};\n"
      css << "  font-display: #{font_display};\n" if font_display
      css << (u ? "  src: url(\"#{u}\") format(\"truetype\");\n" : "  src: local(#{family.inspect});\n")
      css << '}'
      css
    end

    def to_s = handle
    def ==(other) = other.is_a?(FontDrop) && other.handle == handle
    def hash = handle.hash
    def eql?(other) = self == other
  end
end
