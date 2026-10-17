# frozen_string_literal: true

require 'socket'
require 'stringio'

module Preview
  # Minimal HTTP/1.1 primitives (no webrick available).
  class Request
    attr_accessor :method, :path, :query_string, :params, :headers, :body, :cookies, :form, :files, :json, :raw_path, :locale

    def initialize
      @params = {}
      @headers = {}
      @cookies = {}
      @form = {}
      @files = {}
      @json = nil
      @body = +''
    end

    def host = (@headers['host'] || 'localhost')
    def get? = %w[GET HEAD].include?(@method)
    def post? = @method == 'POST'
    def xhr? = @headers['x-requested-with'].to_s.casecmp?('XMLHttpRequest')

    def wants_json?
      a = @headers['accept'].to_s
      a.include?('application/json') || a.include?('application/javascript') || a.include?('text/javascript')
    end

    def referer_path
      r = @headers['referer']
      return nil unless r
      URI.parse(r).path
    rescue URI::InvalidURIError
      nil
    end

    # merged query + body params (flat: first value)
    def param(k)
      v = @form[k]
      v = @json[k] if v.nil? && @json.is_a?(Hash)
      v = Array(@params[k]).first if v.nil?
      v.is_a?(Array) ? v.first : v
    end

    def self.parse_query(qs)
      out = Hash.new { |h, k| h[k] = [] }
      qs.to_s.split('&').each do |pair|
        next if pair.empty?
        k, v = pair.split('=', 2)
        k = URI.decode_www_form_component(k.to_s) rescue k.to_s
        v = URI.decode_www_form_component(v.to_s) rescue v.to_s
        out[k] << v
      end
      out.default_proc = nil
      out
    end

    # Converts flat rails-style keys (properties[Kleur], items[0][id], updates[]) into nested structures.
    def self.nest(pairs)
      root = {}
      pairs.each do |key, value|
        parts = key.scan(/\A[^\[\]]+|\[[^\[\]]*\]/).map { |p| p.delete('[]') }
        parts = [key] if parts.empty?
        cur = root
        parts.each_with_index do |part, i|
          last = i == parts.size - 1
          if part == ''
            cur = (cur['__list__'] ||= [])
            if last
              cur << value
            else
              cur << {}
              cur = cur.last
            end
            next
          end
          if last
            if cur.is_a?(Array)
              cur << value
            else
              cur[part] = value
            end
          else
            cur[part] ||= {}
            cur = cur[part]
          end
        end
      end
      unlist(root)
    end

    def self.unlist(h)
      case h
      when Hash
        return unlist(h['__list__']) if h.keys == ['__list__']
        h.transform_values { |v| unlist(v) }
      when Array then h.map { |v| unlist(v) }
      else h
      end
    end
  end

  class Response
    attr_accessor :status, :headers, :body

    STATUS = {
      200 => 'OK', 201 => 'Created', 204 => 'No Content', 301 => 'Moved Permanently', 302 => 'Found', 303 => 'See Other',
      304 => 'Not Modified', 400 => 'Bad Request', 401 => 'Unauthorized', 404 => 'Not Found', 405 => 'Method Not Allowed',
      422 => 'Unprocessable Entity', 500 => 'Internal Server Error'
    }.freeze

    def initialize(status = 200, headers = {}, body = '')
      @status = status
      @headers = { 'content-type' => 'text/html; charset=utf-8' }.merge(headers)
      @body = body
    end

    def self.html(body, status = 200, headers = {}) = new(status, headers, body)
    def self.json(obj, status = 200, headers = {}) = new(status, { 'content-type' => 'application/json; charset=utf-8' }.merge(headers), JSON.generate(obj))
    def self.redirect(to, status = 302) = new(status, { 'location' => to }, '')
    def self.text(body, status = 200, type = 'text/plain; charset=utf-8') = new(status, { 'content-type' => type }, body)
  end

  class HttpServer
    def initialize(app, port, bind = '127.0.0.1', log: $stderr)
      @app = app
      @port = port
      @bind = bind
      @log = log
    end

    def start
      server = TCPServer.new(@bind, @port)
      @log.puts "[preview] listening on http://#{@bind == '0.0.0.0' ? 'localhost' : @bind}:#{@port} (theme: #{@app.theme.root}#{@app.theme.overlay ? ", overlay: #{@app.theme.overlay}" : ""})"
      @log.flush
      loop do
        sock = server.accept
        Thread.new(sock) { |s| handle(s) }
      end
    end

    def handle(sock)
      sock.setsockopt(Socket::IPPROTO_TCP, Socket::TCP_NODELAY, 1) rescue nil
      loop do
        ready = IO.select([sock], nil, nil, 30)
        break unless ready
        req = read_request(sock)
        break unless req
        t0 = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        res = begin
          @app.call(req)
        rescue StandardError, ScriptError => e
          @log.puts "[preview] 500 #{req.method} #{req.raw_path}: #{e.class}: #{e.message}\n  #{e.backtrace.first(12).join("\n  ")}"
          Response.html("<h1>500 preview server error</h1><pre>#{Util.h(e.class.to_s)}: #{Util.h(e.message)}\n#{Util.h(e.backtrace.first(15).join("\n"))}</pre>", 500)
        end
        ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - t0) * 1000).round
        if ENV['PREVIEW_LOG_REQUESTS'] != '0'
          errs = res.headers['x-liquid-errors']
          @log.puts "[preview] #{res.status} #{req.method} #{req.raw_path} #{ms}ms#{errs && errs != '0' ? " liquid_errors=#{errs}" : ''}"
          @log.flush
        end
        keep = req.headers['connection'].to_s.downcase != 'close'
        write_response(sock, req, res, keep)
        break unless keep
      end
    rescue IOError, Errno::ECONNRESET, Errno::EPIPE, Errno::ENOTCONN
      nil
    ensure
      sock.close rescue nil
    end

    def read_request(sock)
      line = sock.gets("\r\n", 16_384)
      return nil if line.nil?
      line = line.strip
      return nil if line.empty?
      method, target, _ver = line.split(' ', 3)
      req = Request.new
      req.method = method
      req.raw_path = target
      path, qs = target.split('?', 2)
      req.path = URI.decode_www_form_component(path.gsub('+', '%2B')) rescue path
      req.query_string = qs.to_s
      req.params = Request.parse_query(qs)
      while (h = sock.gets("\r\n", 16_384))
        h = h.chomp("\r\n")
        break if h.empty?
        k, v = h.split(':', 2)
        req.headers[k.strip.downcase] = v.to_s.strip
      end
      if (len = req.headers['content-length'].to_i).positive?
        req.body = +''
        req.body << sock.read(len).to_s while req.body.bytesize < len && !sock.eof?
      elsif req.headers['transfer-encoding'].to_s.include?('chunked')
        body = +''
        loop do
          size = sock.gets("\r\n").to_s.strip.to_i(16)
          break if size.zero?
          body << sock.read(size)
          sock.read(2)
        end
        sock.gets("\r\n")
        req.body = body
      end
      req.body.force_encoding('BINARY')
      parse_cookies(req)
      parse_body(req)
      req
    end

    def parse_cookies(req)
      req.headers['cookie'].to_s.split(';').each do |c|
        k, v = c.strip.split('=', 2)
        req.cookies[k] = URI.decode_www_form_component(v.to_s) rescue v.to_s if k
      end
    end

    def parse_body(req)
      ct = req.headers['content-type'].to_s
      body = req.body
      return if body.empty?
      if ct.include?('application/json')
        req.json = JSON.parse(body.dup.force_encoding('UTF-8')) rescue nil
      elsif ct.include?('application/x-www-form-urlencoded') || ct.empty?
        pairs = Request.parse_query(body.dup.force_encoding('UTF-8')).flat_map { |k, vs| vs.map { |v| [k, v] } }
        req.form = Request.nest(pairs)
      elsif ct.include?('multipart/form-data') && (b = ct[/boundary=("?)([^";]+)\1/, 2])
        pairs = []
        body.split("--#{b}").each do |part|
          next if part.strip.empty? || part.start_with?('--')
          head, _, content = part.partition("\r\n\r\n")
          content = content.sub(/\r\n\z/, '')
          name = head[/name="([^"]*)"/, 1]
          next unless name
          if (fname = head[/filename="([^"]*)"/, 1])
            next if fname.empty?
            stored = HttpServer.store_upload(fname, content)
            req.files[name] = { 'filename' => fname, 'size' => content.bytesize,
                                'type' => head[/Content-Type:\s*(\S+)/i, 1], 'url' => stored }
            pairs << [name, stored]
          else
            pairs << [name, content.force_encoding('UTF-8')]
          end
        end
        req.form = Request.nest(pairs)
      end
    end

    UPLOADS = File.join(ENV['PREVIEW_IMG_CACHE'] ? File.dirname(ENV['PREVIEW_IMG_CACHE']) : '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad/cache', 'uploads')

    # Line-item file properties: Shopify stores the upload and puts its URL in the property value.
    def self.store_upload(fname, content)
      FileUtils.mkdir_p(UPLOADS)
      safe = fname.to_s.dup.force_encoding('UTF-8').gsub(/[^\w.\-]+/, '_').then { |x| x.empty? ? 'upload' : x[-[x.length, 80].min..] }
      name = "#{SecureRandom.hex(6)}-#{safe}"
      File.binwrite(File.join(UPLOADS, name), content)
      "/cdn/uploads/#{name}"
    end

    def write_response(sock, req, res, keep)
      body = res.body.to_s
      body = body.dup.force_encoding('BINARY')
      head = +"HTTP/1.1 #{res.status} #{Response::STATUS[res.status] || 'OK'}\r\n"
      res.headers.each { |k, v| Array(v).each { |vv| head << "#{k}: #{vv}\r\n" } }
      head << "content-length: #{body.bytesize}\r\n"
      head << "connection: #{keep ? 'keep-alive' : 'close'}\r\n"
      head << "\r\n"
      sock.write(head)
      sock.write(body) unless req.method == 'HEAD'
    end
  end
end
