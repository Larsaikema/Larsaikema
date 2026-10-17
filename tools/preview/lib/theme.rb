# frozen_string_literal: true

require_relative 'util'

module Preview
  # File access + parsing caches for one theme directory. Everything is keyed by mtime so edits show
  # up on the next request without restarting the server.
  class Theme
    attr_reader :root

    def initialize(root)
      @root = File.expand_path(root)
      @mutex = Mutex.new
      @parsed = {}
      @json = {}
      @schemas = {}
      @raw_blocks = {}
    end

    def path(rel) = File.join(@root, rel)
    def exist?(rel) = File.file?(path(rel))

    def mtime(rel)
      File.mtime(path(rel)).to_f
    rescue StandardError
      0
    end

    def read(rel)
      File.read(path(rel), encoding: 'UTF-8')
    end

    def valid?
      exist?('layout/theme.liquid')
    end

    def name
      settings_schema_info['theme_name'] || File.basename(@root)
    end

    def settings_schema_info
      info = settings_schema.find { |g| g['name'] == 'theme_info' } || {}
      info
    end

    # Parsed Liquid template (cached by path + mtime). Raises Liquid::SyntaxError on parse errors.
    def liquid(rel, env)
      mt = mtime(rel)
      key = rel
      @mutex.synchronize do
        c = @parsed[key]
        return c[1] if c && c[0] == mt
      end
      src = read(rel)
      tpl = Liquid::Template.new(environment: env)
      tpl.parse(src, line_numbers: true, environment: env, error_mode: :lax)
      tpl.name = rel if tpl.respond_to?(:name=)
      @mutex.synchronize { @parsed[key] = [mt, tpl] }
      tpl
    end

    def json(rel)
      mt = mtime(rel)
      @mutex.synchronize do
        c = @json[rel]
        return c[1] if c && c[0] == mt
      end
      data = Util.parse_json_file(path(rel))
      @mutex.synchronize { @json[rel] = [mt, data] }
      data
    end

    def json_or_nil(rel)
      exist?(rel) ? json(rel) : nil
    end

    # Extract the {% schema %} JSON from a section/block file.
    def schema(rel)
      return {} unless exist?(rel)
      mt = mtime(rel)
      @mutex.synchronize do
        c = @schemas[rel]
        return c[1] if c && c[0] == mt
      end
      src = read(rel)
      m = src.match(/\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}/m)
      data = m ? (JSON.parse(m[1]) rescue {}) : {}
      @mutex.synchronize { @schemas[rel] = [mt, data] }
      data
    end

    def section_schema(type) = schema("sections/#{type}.liquid")
    def block_schema(type) = schema("blocks/#{type}.liquid")
    def block_file?(type) = exist?("blocks/#{type}.liquid")

    def settings_schema
      exist?('config/settings_schema.json') ? json('config/settings_schema.json') : []
    end

    def settings_data
      exist?('config/settings_data.json') ? json('config/settings_data.json') : {}
    end

    # Merged theme settings: schema defaults + current (object or preset name).
    def current_settings
      data = settings_data
      cur = data['current']
      cur = (data['presets'] || {})[cur] || {} if cur.is_a?(String)
      cur ||= {}
      merged = {}
      setting_definitions.each do |id, s|
        merged[id] = s['default'] if s.key?('default')
      end
      cur.each { |k, v| merged[k] = v unless k == 'sections' || k == 'content_for_index' || k == 'blocks' }
      merged
    end

    def current_raw
      data = settings_data
      cur = data['current']
      cur = (data['presets'] || {})[cur] || {} if cur.is_a?(String)
      cur || {}
    end

    def setting_definitions
      defs = {}
      settings_schema.each do |group|
        (group['settings'] || []).each { |s| defs[s['id']] = s if s['id'] }
      end
      defs
    end

    def files(dir, ext = nil)
      d = path(dir)
      return [] unless File.directory?(d)
      Dir.children(d).select { |f| ext.nil? || f.end_with?(ext) }.sort
    end

    # Concatenate raw {% stylesheet %} / {% javascript %} bodies from every section, block and snippet
    # (Shopify serves these as compiled_assets/styles.css + scripts.js through content_for_header).
    def compiled_asset(kind)
      tag = kind == :css ? 'stylesheet' : 'javascript'
      parts = []
      %w[sections blocks snippets].each do |dir|
        files(dir, '.liquid').each do |f|
          rel = "#{dir}/#{f}"
          src = read(rel)
          src.scan(/\{%-?\s*#{tag}\s*-?%\}(.*?)\{%-?\s*end#{tag}\s*-?%\}/m) do |m|
            body = m[0].strip
            next if body.empty?
            if kind == :css
              parts << "/* #{rel} */\n#{body}"
            else
              parts << "/* #{rel} */\n(function() {\n#{body}\n})();"
            end
          end
        end
      end
      parts.join("\n\n")
    end

    def compiled_version
      %w[sections blocks snippets].sum do |dir|
        d = path(dir)
        File.directory?(d) ? File.mtime(d).to_i : 0
      end
    end

    # --- locales -----------------------------------------------------------
    def locale_files
      files('locales', '.json')
    end

    def default_locale_file(schema: false)
      suffix = schema ? '.default.schema.json' : '.default.json'
      locale_files.find { |f| f.end_with?(suffix) && (schema || !f.end_with?('.schema.json')) }
    end

    # translations for storefront locale (e.g. 'nl'): <locale>.json (or <locale>.default.json) over the default.
    def translations(locale, schema: false)
      key = "#{locale}:#{schema}"
      deps = locale_files.map { |f| [f, mtime("locales/#{f}")] }
      @mutex.synchronize do
        c = @json["__tr:#{key}"]
        return c[1] if c && c[0] == deps
      end
      default_file = default_locale_file(schema: schema)
      base = default_file ? json("locales/#{default_file}") : {}
      ext = schema ? '.schema.json' : '.json'
      cand = ["#{locale}#{ext}", "#{locale}.default#{ext}", "#{locale.to_s.split('-').first}#{ext}"]
      file = cand.find { |f| exist?("locales/#{f}") && f != default_file }
      merged = file ? deep_merge(base, json("locales/#{file}")) : base
      @mutex.synchronize { @json["__tr:#{key}"] = [deps, merged] }
      merged
    end

    def default_locale_code
      f = default_locale_file
      f ? f.split('.').first : 'en'
    end

    def deep_merge(a, b)
      a.merge(b) { |_k, x, y| x.is_a?(Hash) && y.is_a?(Hash) ? deep_merge(x, y) : y }
    end
  end
end
