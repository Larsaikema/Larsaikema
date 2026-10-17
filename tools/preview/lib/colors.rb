# frozen_string_literal: true

module Preview
  # Shopify `color` object + color math used by the color_* filters.
  class ColorDrop < Liquid::Drop
    attr_reader :r, :g, :b, :a

    def self.parse(v)
      return v if v.is_a?(ColorDrop)
      return nil if v.nil?
      s = v.to_s.strip
      return nil if s.empty?
      rgba = Colors.parse(s)
      rgba ? new(*rgba) : nil
    end

    def initialize(r, g, b, a = 1.0)
      super()
      # channels are rounded (not truncated) like Shopify's color filters: mix(#f00, #00f, 50) = #800080
      @r = ch(r)
      @g = ch(g)
      @b = ch(b)
      @a = a.to_f.clamp(0.0, 1.0)
    end

    def ch(v) = (v.is_a?(Numeric) ? v.round : v.to_i).clamp(0, 255)

    def red = @r
    def green = @g
    def blue = @b
    def alpha = (@a == @a.round ? @a.round : @a.round(3))

    def rgb = "#{@r} #{@g} #{@b}"
    def rgba = "#{@r} #{@g} #{@b} / #{fmt_a}"

    def hue = Colors.rgb_to_hsl(@r, @g, @b)[0].round
    def saturation = Colors.rgb_to_hsl(@r, @g, @b)[1].round
    def lightness = Colors.rgb_to_hsl(@r, @g, @b)[2].round

    def fmt_a
      v = @a.round(2)
      v == v.to_i ? v.to_i.to_s : v.to_s.sub(/0+\z/, '')
    end

    def hex
      if @a < 1.0
        format('#%02x%02x%02x%02x', @r, @g, @b, (@a * 255).round)
      else
        format('#%02x%02x%02x', @r, @g, @b)
      end
    end

    def to_s = hex
    def to_str = hex
    def to_liquid_value = self

    def blank? = false

    def ==(other)
      o = other.is_a?(ColorDrop) ? other : ColorDrop.parse(other)
      return false unless o
      [@r, @g, @b, @a.round(3)] == [o.r, o.g, o.b, o.a.round(3)]
    rescue StandardError
      false
    end

    def eql?(other) = self == other
    def hash = [@r, @g, @b, @a.round(3)].hash
  end

  module Colors
    module_function

    NAMED = {
      'black' => [0, 0, 0], 'white' => [255, 255, 255], 'red' => [255, 0, 0], 'green' => [0, 128, 0],
      'blue' => [0, 0, 255], 'transparent' => [0, 0, 0, 0.0], 'gray' => [128, 128, 128], 'grey' => [128, 128, 128],
      'yellow' => [255, 255, 0], 'orange' => [255, 165, 0], 'purple' => [128, 0, 128], 'pink' => [255, 192, 203]
    }.freeze

    def parse(s)
      s = s.to_s.strip.downcase
      if (m = s.match(/\A#?([0-9a-f]{3,8})\z/))
        hex = m[1]
        case hex.length
        when 3 then return hex.chars.map { |c| (c * 2).to_i(16) } + [1.0]
        when 4
          c = hex.chars.map { |x| (x * 2).to_i(16) }
          return c[0, 3] + [c[3] / 255.0]
        when 6 then return [hex[0, 2], hex[2, 2], hex[4, 2]].map { |x| x.to_i(16) } + [1.0]
        when 8 then return [hex[0, 2], hex[2, 2], hex[4, 2]].map { |x| x.to_i(16) } + [hex[6, 2].to_i(16) / 255.0]
        end
      end
      if (m = s.match(/\Argba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,\/]\s*([\d.]+%?))?\s*\)\z/))
        a = m[4] ? (m[4].end_with?('%') ? m[4].to_f / 100.0 : m[4].to_f) : 1.0
        return [m[1].to_f.round, m[2].to_f.round, m[3].to_f.round, a]
      end
      if (m = s.match(/\Ahsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,\/]\s*([\d.]+%?))?\s*\)\z/))
        r, g, b = hsl_to_rgb(m[1].to_f, m[2].to_f, m[3].to_f)
        a = m[4] ? (m[4].end_with?('%') ? m[4].to_f / 100.0 : m[4].to_f) : 1.0
        return [r, g, b, a]
      end
      if NAMED[s]
        v = NAMED[s]
        return v.size == 4 ? v : v + [1.0]
      end
      nil
    end

    def rgb_to_hsl(r, g, b)
      r /= 255.0
      g /= 255.0
      b /= 255.0
      max = [r, g, b].max
      min = [r, g, b].min
      l = (max + min) / 2.0
      if max == min
        h = s = 0.0
      else
        d = max - min
        s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min)
        h = if max == r then ((g - b) / d) + (g < b ? 6 : 0)
            elsif max == g then ((b - r) / d) + 2
            else ((r - g) / d) + 4
            end
        h /= 6.0
      end
      [h * 360.0, s * 100.0, l * 100.0]
    end

    def hsl_to_rgb(h, s, l)
      h = (h % 360) / 360.0
      s /= 100.0
      l /= 100.0
      return [l * 255, l * 255, l * 255].map(&:round) if s.zero?
      q = l < 0.5 ? l * (1 + s) : l + s - (l * s)
      p = (2 * l) - q
      [h + (1.0 / 3), h, h - (1.0 / 3)].map do |t|
        t += 1 if t.negative?
        t -= 1 if t > 1
        v = if t < 1.0 / 6 then p + ((q - p) * 6 * t)
            elsif t < 0.5 then q
            elsif t < 2.0 / 3 then p + ((q - p) * ((2.0 / 3) - t) * 6)
            else p
            end
        (v * 255).round
      end
    end

    # W3C brightness (0-255)
    def brightness(c)
      ((c.r * 299) + (c.g * 587) + (c.b * 114)) / 1000.0
    end

    def luminance(c)
      [c.r, c.g, c.b].map do |v|
        v /= 255.0
        v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055)**2.4
      end.then { |r, g, b| (0.2126 * r) + (0.7152 * g) + (0.0722 * b) }
    end

    def contrast(a, b)
      l1 = luminance(a)
      l2 = luminance(b)
      l1, l2 = l2, l1 if l2 > l1
      ((l1 + 0.05) / (l2 + 0.05)).round(1)
    end

    def from_hsl(h, s, l, a)
      r, g, b = hsl_to_rgb(h, s.clamp(0, 100), l.clamp(0, 100))
      ColorDrop.new(r, g, b, a)
    end

    # Output format mirrors the input format like Shopify: hex in → hex out; rgb(a) in → rgba out.
    def output(color, input)
      s = input.to_s.strip
      if s.start_with?('rgb') || s.start_with?('hsl')
        if color.a < 1.0 || s.start_with?('rgba') || s.start_with?('hsla')
          "rgba(#{color.r}, #{color.g}, #{color.b}, #{color.fmt_a})"
        else
          "rgb(#{color.r}, #{color.g}, #{color.b})"
        end
      else
        color.hex
      end
    end
  end
end
