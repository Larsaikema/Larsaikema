# frozen_string_literal: true

require 'json'
require 'cgi'
require 'uri'
require 'zlib'
require 'digest'
require 'time'
require 'date'

module Preview
  module Util
    module_function

    HTML_ESCAPE = { '&' => '&amp;', '<' => '&lt;', '>' => '&gt;', '"' => '&quot;', "'" => '&#39;' }.freeze

    def h(s)
      s.to_s.gsub(/[&<>"']/, HTML_ESCAPE)
    end

    def escape_once(s)
      s.to_s.gsub(/["><']|&(?!([a-zA-Z]+|(#\d+)|(#x[\da-fA-F]+));)/, HTML_ESCAPE)
    end

    # Shopify handleize: lowercase, strip accents-ish, non-alnum -> '-', collapse, trim.
    def handleize(s)
      str = s.to_s.dup
      str = str.unicode_normalize(:nfkd).gsub(/[̀-ͯ]/, '') rescue str
      str = str.downcase
      str = str.gsub(/['"()\[\]]/, '')
      str = str.gsub(/[^\p{Alnum}]+/u, '-')
      str = str.gsub(/-+/, '-')
      str.sub(/\A-/, '').sub(/-\z/, '')
    end

    def strip_html(s)
      s.to_s.gsub(%r{<script.*?</script>|<!--.*?-->|<style.*?</style>}m, '').gsub(/<.*?>/m, '')
    end

    def stable_id(seed, base = 7_000_000_000_000)
      base + (Zlib.crc32(seed.to_s) % 900_000_000_000)
    end

    def url_encode(s)
      URI.encode_www_form_component(s.to_s)
    end

    def parse_time(v)
      return v if v.is_a?(Time)
      return nil if v.nil? || v.to_s.strip.empty?
      Time.parse(v.to_s)
    rescue ArgumentError
      nil
    end

    # Strip /* */ and // comments outside of strings so Shopify JSON (with header comment) parses.
    def strip_json_comments(src)
      out = +''
      i = 0
      in_str = false
      while i < src.length
        c = src[i]
        if in_str
          out << c
          if c == '\\'
            out << src[i + 1].to_s
            i += 2
            next
          end
          in_str = false if c == '"'
          i += 1
        elsif c == '"'
          in_str = true
          out << c
          i += 1
        elsif c == '/' && src[i + 1] == '*'
          j = src.index('*/', i + 2)
          i = j ? j + 2 : src.length
        elsif c == '/' && src[i + 1] == '/'
          j = src.index("\n", i + 2)
          i = j || src.length
        else
          out << c
          i += 1
        end
      end
      out
    end

    def parse_json_file(path)
      JSON.parse(strip_json_comments(File.read(path, encoding: 'UTF-8')))
    end

    def deep_dup(o)
      case o
      when Hash then o.each_with_object({}) { |(k, v), m| m[k] = deep_dup(v) }
      when Array then o.map { |v| deep_dup(v) }
      else o
      end
    end

    # money amount formatting helpers (cents → formatted string)
    def delimit(int_str, delim)
      int_str.reverse.scan(/\d{1,3}/).join(delim).reverse
    end

    def format_amount(cents, precision, thousands, decimal)
      cents = cents.to_f
      value = (cents / 100.0).round(precision)
      neg = value.negative?
      value = value.abs
      parts = format("%.#{precision}f", value).split('.')
      s = delimit(parts[0], thousands)
      s += decimal + parts[1] if precision.positive?
      neg ? "-#{s}" : s
    end

    def money_format_apply(cents, format_str)
      return '' if cents.nil?
      cents = cents.to_s.include?('.') ? cents.to_f : cents.to_i if cents.is_a?(String)
      format_str.to_s.gsub(/\{\{\s*(\w+)\s*\}\}/) do
        case Regexp.last_match(1)
        when 'amount' then format_amount(cents, 2, ',', '.')
        when 'amount_no_decimals' then format_amount(cents, 0, ',', '.')
        when 'amount_with_comma_separator' then format_amount(cents, 2, '.', ',')
        when 'amount_no_decimals_with_comma_separator' then format_amount(cents, 0, '.', ',')
        when 'amount_with_apostrophe_separator' then format_amount(cents, 2, "'", '.')
        when 'amount_no_decimals_with_space_separator' then format_amount(cents, 0, ' ', '')
        when 'amount_with_space_separator' then format_amount(cents, 2, ' ', ',')
        when 'amount_with_period_and_space_separator' then format_amount(cents, 2, ' ', '.')
        else format_amount(cents, 2, ',', '.')
        end
      end
    end

    def num(v)
      return v if v.is_a?(Numeric)
      return 0 if v.nil? || v == ''
      s = v.to_s
      s.match?(/\A-?\d+\z/) ? s.to_i : s.to_f
    end

    def to_bool(v)
      return v if v == true || v == false
      return false if v.nil?
      %w[true 1 yes on].include?(v.to_s.downcase)
    end
  end
end
