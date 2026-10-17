# frozen_string_literal: true

module Preview
  # Reads pixel dimensions from PNG / JPEG / GIF / WebP / SVG headers without external gems.
  module ImageInfo
    module_function

    @cache = {}
    @mutex = Mutex.new

    def dimensions(path)
      return nil unless path && File.file?(path)
      key = [path, File.mtime(path).to_i]
      @mutex.synchronize { return @cache[key] if @cache.key?(key) }
      dims = read_dimensions(path)
      @mutex.synchronize { @cache[key] = dims }
      dims
    rescue StandardError
      nil
    end

    def read_dimensions(path)
      File.open(path, 'rb') do |f|
        head = f.read(64) || ''
        if head.start_with?("\x89PNG".b)
          return head[16, 8].unpack('NN')
        elsif head.start_with?('GIF8')
          return head[6, 4].unpack('vv')
        elsif head[0, 4] == 'RIFF' && head[8, 4] == 'WEBP'
          return webp_dims(head, f)
        elsif head.start_with?("\xFF\xD8".b)
          return jpeg_dims(f)
        elsif path.end_with?('.svg')
          src = File.read(path, 4096)
          w = src[/\bwidth="([\d.]+)/, 1]
          hgt = src[/\bheight="([\d.]+)/, 1]
          if (vb = src[/viewBox="([\d.\s-]+)"/, 1])
            parts = vb.split.map(&:to_f)
            w ||= parts[2]
            hgt ||= parts[3]
          end
          return [w.to_f.round, hgt.to_f.round] if w && hgt
        end
      end
      nil
    end

    def webp_dims(head, _f)
      chunk = head[12, 4]
      case chunk
      when 'VP8 '
        w, h = head[26, 4].unpack('vv')
        [w & 0x3fff, h & 0x3fff]
      when 'VP8L'
        b = head[21, 4].unpack('C4')
        w = 1 + (((b[1] & 0x3F) << 8) | b[0])
        h = 1 + (((b[3] & 0xF) << 10) | (b[2] << 2) | ((b[1] & 0xC0) >> 6))
        [w, h]
      when 'VP8X'
        w = 1 + head[24, 3].unpack('C3').each_with_index.sum { |v, i| v << (8 * i) }
        h = 1 + head[27, 3].unpack('C3').each_with_index.sum { |v, i| v << (8 * i) }
        [w, h]
      end
    end

    def jpeg_dims(f)
      f.seek(2)
      loop do
        marker = f.read(2)
        return nil unless marker && marker.getbyte(0) == 0xFF
        code = marker.getbyte(1)
        len = f.read(2).unpack1('n')
        if (0xC0..0xCF).cover?(code) && ![0xC4, 0xC8, 0xCC].include?(code)
          data = f.read(5)
          h, w = data[1, 4].unpack('nn')
          return [w, h]
        end
        f.seek(len - 2, IO::SEEK_CUR)
      end
    end
  end
end
