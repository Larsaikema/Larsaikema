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
      if fmt in ('jpg', 'jpeg', 'pjpg') and im.mode in ('RGBA', 'P', 'LA'):
          bg = Image.new('RGB', im.size, (255, 255, 255))
          im = im.convert('RGBA')
          bg.paste(im, mask=im.split()[-1])
          im = bg
      save_fmt = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'pjpg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP', 'gif': 'GIF'}.get(fmt, 'PNG')
      kw = {'quality': 85} if save_fmt in ('JPEG', 'WEBP') else {'optimize': True}
      if fmt == 'pjpg':
          kw['progressive'] = True
      im.save(dst, save_fmt, **kw)
    PY

    @locks = Hash.new { |h, k| h[k] = Mutex.new }
    @global = Mutex.new

    def resize(src, width, height, crop, fmt)
      ext = File.extname(src).delete('.').downcase
      ext = 'jpg' if ext == 'jpeg'
      # Shopify converts png -> jpg/pjpg and jpg -> pjpg; other requests keep the source format
      fmt = fmt.to_s.downcase
      fmt = ext unless %w[jpg pjpg].include?(fmt) && %w[png jpg webp gif].include?(ext)
      return [src, ext] if width.to_i.zero? && height.to_i.zero? && fmt == ext
      FileUtils.mkdir_p(CACHE)
      key = Digest::SHA1.hexdigest([src, File.mtime(src).to_i, width, height, crop, fmt].join('|'))
      out_ext = fmt == 'pjpg' ? 'jpg' : fmt
      dst = File.join(CACHE, "#{key}.#{fmt == 'pjpg' ? 'p.jpg' : out_ext}")
      return [dst, out_ext] if File.exist?(dst)
      lock = @global.synchronize { @locks[key] }
      lock.synchronize do
        return [dst, out_ext] if File.exist?(dst)
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
      [dst, out_ext]
    end
  end

  # Neutral line-art placeholder illustrations for placeholder_svg_tag (Shopify's names: product-1..6,
  # collection-1..6, lifestyle-1..2, image, page, hero/blog/product/collection/detailed-apparel-N).
  # Lines use currentColor so the theme's placeholder color (e.g. Dawn's .placeholder) applies.
  module Placeholders
    module_function

    STROKE = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".5"'
    BG = '<rect width="525.5" height="525.5" fill="currentColor" opacity=".05"/>'

    def svg(name, klass = nil)
      name = name.to_s
      klass_attr = klass && !klass.to_s.empty? ? " class=\"#{Util.h(klass)}\"" : ' class="placeholder-svg"'
      %(<svg#{klass_attr} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525.5 525.5" preserveAspectRatio="xMidYMid slice" data-placeholder="#{Util.h(name)}">#{BG}<g #{STROKE}>#{drawing(name)}</g></svg>)
    end

    DRAWINGS = {
      tshirt: '<path d="M205 150l-62 42 26 52 26-13v148h137V231l26 13 26-52-62-42c-10 22-33 36-58 36s-48-14-59-36z"/><path d="M227 163c8 10 21 16 36 16s28-6 36-16"/>',
      dress: '<path d="M240 130h46l-4 40 26 50-14 6 40 140H192l40-140-14-6 26-50z"/><path d="M240 130c6 10 14 15 23 15s17-5 23-15M232 226h62"/>',
      sneaker: '<path d="M140 330c30 0 62-8 86-38l22 14c18 12 50 22 98 26 26 2 40 14 40 30v8H140z"/><path d="M140 370h246M226 292l18 30M246 300l14 26M268 310l10 22"/>',
      jacket: '<path d="M215 140l-50 30-25 190h50l10-120v150h126V240l10 120h50l-25-190-50-30-25 30h-46z"/><path d="M263 170v200M240 160l23 40 23-40M290 260h18M218 260h18"/>',
      bag: '<rect x="175" y="215" width="176" height="150" rx="14"/><path d="M215 215v-32a48 48 0 0196 0v32M175 255h176"/>',
      cap: '<path d="M170 300c0-60 42-100 93-100s93 40 93 100z"/><path d="M356 300c30 0 50 10 50 22H170M263 200v-12"/>',
      lamp: '<path d="M210 210h106l-22-70h-62z"/><path d="M263 210v130M223 360h80M263 340v20"/>',
      bottle: '<path d="M243 140h40v40c22 12 34 30 34 56v130c0 10-8 18-18 18h-72c-10 0-18-8-18-18V236c0-26 12-44 34-56z"/><path d="M226 260h74"/>',
      chair: '<path d="M200 150h126v120H200zM190 270h146v26H190zM205 296l-10 90M321 296l10 90M235 296v60M291 296v60"/>',
      vase: '<path d="M240 160h46c0 30 34 50 34 110 0 50-26 90-57 90s-57-40-57-90c0-60 34-80 34-110z"/><path d="M220 300h86"/>',
      clock: '<circle cx="263" cy="250" r="95"/><path d="M263 190v60l40 26M233 352l-10 34h80l-10-34"/>',
      plant: '<path d="M215 300h96l-12 80h-72z"/><path d="M263 300v-70M263 250c-30-10-50-40-46-70 30 4 48 30 46 70zM263 236c26-14 48-36 46-66-30 6-46 32-46 66z"/>',
      stack: '<rect x="150" y="160" width="140" height="180" rx="8"/><rect x="236" y="190" width="140" height="180" rx="8"/><path d="M170 190h100M256 220h100M170 210h60"/>',
      rack: '<path d="M110 150h306M140 150v250M386 150v250M120 400h40M366 400h40"/><path d="M190 150v18l-26 22v120h60V190l-26-22M263 150v18l-30 22 8 150h44l8-150-30-22M336 150v18l-26 22v100h52V190l-26-22"/>',
      scene: '<path d="M40 400l120-140 90 100 60-60 175 120"/><circle cx="380" cy="160" r="36"/><path d="M40 430h445"/>',
      image: '<rect x="150" y="170" width="225" height="185" rx="12"/><path d="M165 330l70-80 50 55 30-30 45 55"/><circle cx="320" cy="215" r="18"/>',
      page: '<path d="M195 140h105l40 40v205H195z"/><path d="M300 140v40h40M220 220h90M220 250h90M220 280h90M220 310h60"/>'
    }.freeze

    def drawing(name)
      key = case name
            when /\Ahero-apparel-1/ then :rack
            when /\Ahero-apparel-2/ then :stack
            when /\Ahero-apparel-3/ then :scene
            when /\Ablog-apparel-(\d)/ then %i[rack dress scene][Regexp.last_match(1).to_i % 3]
            when /\Adetailed-apparel/ then :jacket
            when /\A(?:product|collection)-apparel-(\d)/ then %i[jacket tshirt dress sneaker][Regexp.last_match(1).to_i % 4]
            when /\Aproduct-(\d)/ then %i[clock lamp bag bottle chair vase][Regexp.last_match(1).to_i % 6]
            when /\Acollection-(\d)/ then %i[stack plant cap bag vase lamp][Regexp.last_match(1).to_i % 6]
            when /\Alifestyle/ then :scene
            when 'page' then :page
            else :image
            end
      DRAWINGS[key]
    end
  end
end
