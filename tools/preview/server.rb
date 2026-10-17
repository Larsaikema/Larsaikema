#!/usr/bin/env ruby
# frozen_string_literal: true

# Local Shopify Online Store 2.0 preview server.
#   ruby tools/preview/server.rb --theme <dir> --data <fixture.json> --port <n> [--images <dir>] [--bind 127.0.0.1]
# See tools/preview/README.md.

require 'optparse'

HERE = __dir__
require File.join(HERE, 'vendor', 'strscan_shim')
$LOAD_PATH.unshift File.join(HERE, 'vendor', 'liquid', 'lib')
require 'liquid'
require 'openssl'

%w[util image_info store cart colors fonts images drops/base drops/product drops/collection drops/cart drops/content
   drops/global drops/theme_objects filters liquid_patches tags theme render_context http app api].each do |f|
  require File.join(HERE, 'lib', f)
end

if $PROGRAM_NAME == __FILE__
  opts = { port: 4100, bind: '127.0.0.1' }
  OptionParser.new do |o|
    o.banner = 'Usage: ruby tools/preview/server.rb --theme DIR --data FIXTURE.json [--port N] [--images DIR]'
    o.on('--theme DIR') { |v| opts[:theme] = v }
    o.on('--data FILE') { |v| opts[:data] = v }
    o.on('--port N', Integer) { |v| opts[:port] = v }
    o.on('--images DIR') { |v| opts[:images] = v }
    o.on('--bind ADDR') { |v| opts[:bind] = v }
  end.parse!
  abort 'missing --theme' unless opts[:theme]
  opts[:data] ||= File.join(HERE, 'fixtures', 'sample.json')
  abort "fixture not found: #{opts[:data]}" unless File.exist?(opts[:data])
  $stdout.sync = true
  $stderr.sync = true
  app = Preview::App.new(theme_dir: opts[:theme], data_path: opts[:data], images_dir: opts[:images])
  trap('TERM') { exit }
  trap('INT') { exit }
  Preview::HttpServer.new(app, opts[:port], opts[:bind]).start
end
