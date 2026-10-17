# frozen_string_literal: true

require 'open3'
require 'fileutils'

module Preview
  # image_url results are strings that remember which image they point to, so image_tag can build srcset.
  class ImageUrl < String
    attr_accessor :image, :width, :height, :crop, :format, :pad_color

    def self.build(image, width: nil, height: nil, crop: nil, format: nil, pad_color: nil)
      base = image.respond_to?(:base_url) ? image.base_url : image.to_s
      params = []
      params << "width=#{width.to_i}" if width
      params << "height=#{height.to_i}" if height
      params << "crop=#{crop}" if crop
      params << "format=#{format}" if format
      params << "pad_color=#{pad_color}" if pad_color
      url = base.dup
      url += (url.include?('?') ? '&' : '?') + params.join('&') unless params.empty?
      s = new(url)
      s.image = image
      s.width = width&.to_i
      s.height = height&.to_i
      s.crop = crop
      s.format = format
      s
    end

    # url for another width keeping the other params
    def with_width(w)
      ImageUrl.build(image, width: w, height: (height && width ? (height.to_f * w / width).round : nil),
                            crop: crop, format: format).to_s
    end
  end

  # Resizes images on demand with python3 + Pillow; results cached on disk.
  module ImageResizer
    module_function

    CACHE = ENV['PREVIEW_IMG_CACHE'] ||
            '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad/cache/img'
    SCRIPT = <<~PY
      import sys
      from PIL import Image, ImageOps
      src, dst, w, h, crop, fmt = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], sys.argv[6]
      im = Image.open(src)
      im = ImageOps.exif_transpose(im)
      ow, oh = im.size
      if w and h and crop != 'none':
          tr = w / h
          r = ow / oh
          if r > tr:
              nw = int(oh * tr)
              x = {'left': 0, 'right': ow - nw}.get(crop, (ow - nw) // 2)
              im = im.crop((x, 0, x + nw, oh))
          else:
              nh = int(ow / tr)
              y = {'top': 0, 'bottom': oh - nh}.get(crop, (oh - nh) // 2)
              im = im.crop((0, y, ow, y + nh))
          im = im.resize((min(w, im.size[0]), min(h, im.size[1])), Image.LANCZOS)
      else:
          if w and not h:
              h = round(oh * w / ow)
          elif h and not w:
              w = round(ow * h / oh)
          if w and h:
              w, h = min(w, ow), min(h, oh)
              im.thumbnail((w, h), Image.LANCZOS)
      if fmt in ('jpg', 'jpeg') and im.mode in ('RGBA', 'P', 'LA'):
          im = im.convert('RGB')
      save_fmt = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP', 'gif': 'GIF'}.get(fmt, 'PNG')
      kw = {'quality': 85} if save_fmt in ('JPEG', 'WEBP') else {'optimize': True}
      im.save(dst, save_fmt, **kw)
    PY

    @locks = Hash.new { |h, k| h[k] = Mutex.new }
    @global = Mutex.new

    def resize(src, width, height, crop, fmt)
      ext = File.extname(src).delete('.').downcase
      fmt = (fmt.nil? || fmt.empty? || fmt == 'pjpg') ? ext : fmt
      fmt = 'jpg' if fmt == 'pjpg'
      return [src, ext] if width.to_i.zero? && height.to_i.zero? && fmt == ext
      FileUtils.mkdir_p(CACHE)
      key = Digest::SHA1.hexdigest([src, File.mtime(src).to_i, width, height, crop, fmt].join('|'))
      dst = File.join(CACHE, "#{key}.#{fmt}")
      return [dst, fmt] if File.exist?(dst)
      lock = @global.synchronize { @locks[key] }
      lock.synchronize do
        return [dst, fmt] if File.exist?(dst)
        tmp = "#{dst}.#{Process.pid}.#{Thread.current.object_id}.tmp"
        _out, err, st = Open3.capture3('python3', '-I', '-c', SCRIPT, src, tmp, width.to_i.to_s, height.to_i.to_s,
                                       (crop || 'center').to_s, fmt)
        if st.success?
          File.rename(tmp, dst)
        else
          warn "[preview] resize failed for #{src}: #{err}"
          FileUtils.rm_f(tmp)
          return [src, ext]
        end
      end
      [dst, fmt]
    end
  end

  # Neutral line-art placeholder illustrations for placeholder_svg_tag.
  module Placeholders
    module_function

    def svg(name, klass = nil)
      name = name.to_s
      body = drawing(name)
      klass_attr = klass && !klass.to_s.empty? ? " class=\"#{Util.h(klass)}\"" : ' class="placeholder-svg"'
      %(<svg#{klass_attr} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525.5 525.5" preserveAspectRatio="xMidYMid slice" data-placeholder="#{Util.h(name)}">#{body}</svg>)
    end

    def drawing(name)
      stroke = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".45"'
      bg = '<rect width="525.5" height="525.5" fill="currentColor" opacity=".06"/>'
      case name
      when /product-1|apparel-1|product-apparel-1/
        bg + %(<g #{stroke}><path d="M200 150l-60 40 25 50 25-12v150h146V228l25 12 25-50-60-40c-10 22-34 36-63 36s-53-14-63-36z"/></g>)
      when /product-2|apparel-2|product-apparel-2/
        bg + %(<g #{stroke}><path d="M190 170h146l20 200H170z"/><path d="M215 170c0-30 22-50 48-50s48 20 48 50"/></g>)
      when /product-3|apparel-3|product-apparel-3/
        bg + %(<g #{stroke}><path d="M150 330c40 0 70-20 90-60l25 20c20 15 50 20 110 20v40H150z"/><path d="M150 370h225"/></g>)
      when /product-4|apparel-4|product-apparel-4/
        bg + %(<g #{stroke}><path d="M263 130c-40 50-60 90-60 130a60 60 0 00120 0c0-40-20-80-60-130z"/><path d="M233 400h60M263 320v80"/></g>)
      when /product-5/
        bg + %(<g #{stroke}><rect x="170" y="200" width="185" height="150" rx="10"/><path d="M200 200v-40h125v40M170 260h185"/></g>)
      when /product-6/
        bg + %(<g #{stroke}><circle cx="263" cy="250" r="90"/><path d="M263 190v60l40 25"/><path d="M233 345l-10 40h80l-10-40"/></g>)
      when /collection/
        bg + %(<g #{stroke}><rect x="140" y="170" width="130" height="170" rx="8"/><rect x="255" y="200" width="130" height="170" rx="8"/><path d="M160 200h90M275 230h90"/></g>)
      when /lifestyle|hero|banner|slideshow/
        bg + %(<g #{stroke}><path d="M60 400l120-140 90 100 60-60 140 100"/><circle cx="380" cy="160" r="36"/><path d="M60 430h405"/></g>)
      else
        bg + %(<g #{stroke}><rect x="150" y="170" width="225" height="185" rx="12"/><path d="M165 330l70-80 50 55 30-30 45 55"/><circle cx="320" cy="215" r="18"/></g>)
      end
    end
  end
end
