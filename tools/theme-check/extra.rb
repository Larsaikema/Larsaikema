# Checks that Shopify enforces on upload/save but theme-check does not (or only partly) catch:
#  1. every .liquid file parses with Liquid's strict parser (error_mode: :strict). The preview renders in lax mode, like
#     old Shopify; strict failures are LiquidHTMLSyntaxError in theme-check and break on stricter Shopify parsing.
#  2. schema names are at most 25 characters: section name, every block name and every preset name
#     (theme-check's ValidSchemaName only looks at the section name).
# Usage: ruby tools/theme-check/extra.rb <theme dir>   (exit 1 on any failure)
require 'json'
SCRATCH = ENV['SCRATCH'] || '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad'
shim = File.join(SCRATCH, 'vendor', 'strscan_shim.rb')
require shim if File.exist?(shim)
load File.expand_path('../preview/server.rb', __dir__)

root = File.expand_path(ARGV[0] || File.expand_path('../../theme', __dir__))
env = Liquid::Environment.build(error_mode: :strict) do |e|
  e.register_filter(Preview::ShopifyFilters)
  {
    'section' => Preview::Tags::Section, 'sections' => Preview::Tags::Sections, 'schema' => Preview::Tags::RawNoOutput,
    'stylesheet' => Preview::Tags::RawNoOutput, 'javascript' => Preview::Tags::RawNoOutput, 'style' => Preview::Tags::Style,
    'layout' => Preview::Tags::Layout, 'render' => Preview::Tags::Render, 'content_for' => Preview::Tags::ContentFor,
    'paginate' => Preview::Tags::Paginate, 'form' => Preview::Tags::Form
  }.each { |k, v| e.register_tag(k, v) }
end

failures = []
files = Dir.glob(File.join(root, '**', '*.liquid')).sort
files.each do |f|
  rel = f.delete_prefix(root + '/')
  src = File.read(f)
  begin
    Liquid::Template.parse(src, environment: env, error_mode: :strict, line_numbers: true)
  rescue StandardError => e
    failures << "#{rel}: strict Liquid: #{e.message[0, 220]}"
  end
  next unless rel.start_with?('sections/', 'blocks/')

  m = src.match(/\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}/m)
  next unless m

  begin
    schema = JSON.parse(m[1])
  rescue JSON::ParserError => e
    failures << "#{rel}: schema JSON: #{e.message[0, 160]}"
    next
  end
  check = lambda do |what, name|
    next if name.nil? || name.start_with?('t:')

    failures << "#{rel}: #{what} name '#{name}' is #{name.length} characters (max 25)" if name.length > 25
  end
  check.call('section', schema['name'])
  (schema['blocks'] || []).each { |b| check.call("block '#{b['type']}'", b['name']) }
  (schema['presets'] || []).each { |p| check.call('preset', p['name']) }
end

puts failures
puts "extra checks: #{files.size} liquid files, #{failures.size} failures"
exit(failures.empty? ? 0 : 1)
