# frozen_string_literal: true

module Preview
  class PageDrop < BaseDrop
    def initialize(rc, page)
      super(rc)
      @pg = page
    end

    def model_key = @pg.id
    def id = @pg.id
    def handle = @pg.handle
    def title = @pg.title
    def url = "/pages/#{@pg.handle}"
    def content = @pg.body_html
    def author = @pg.author
    def published_at = @pg.published_at
    def template_suffix = @pg.template_suffix
    def metafields = MetafieldsDrop.new(rc, @pg.metafields)
    def object_type = 'page'
    def to_s = @pg.title
    def as_json = { 'id' => id, 'title' => title, 'handle' => handle, 'body_html' => content, 'url' => url }
  end

  class PagesDrop < BaseDrop
    def liquid_method_missing(handle)
      pg = rc.store.page(handle.to_s)
      pg && rc.page_drop(pg)
    end

    def size = rc.store.pages.size
    def each(&) = rc.store.pages.map { |p| rc.page_drop(p) }.each(&)
  end

  class BlogDrop < BaseDrop
    attr_reader :b

    def initialize(rc, blog, main: false)
      super(rc)
      @b = blog
      @main = main
    end

    def model_key = @b.id
    def id = @b.id
    def handle = @b.handle
    def title = @b.title
    def url = "/blogs/#{@b.handle}"
    def template_suffix = @b.template_suffix
    def metafields = MetafieldsDrop.new(rc, @b.metafields)
    def comments_enabled? = @b.comments != 'disabled'
    def moderated? = @b.comments == 'moderate'
    def all_tags = @b.all_tags
    def object_type = 'blog'
    def to_s = @b.title

    def filtered_articles
      tag = @main ? rc.current_tags&.first : nil
      list = @b.articles
      list = list.select { |a| a.tags.map { |t| Util.handleize(t) }.include?(Util.handleize(tag)) } if tag
      list
    end

    def articles
      @articles ||= PaginatedArray.build(filtered_articles.map { |a| rc.article_drop(a) })
    end

    def articles_count = filtered_articles.size
    def tags = filtered_articles.flat_map(&:tags).uniq.sort

    def next_article
      a = rc.main_article
      i = a && @b.articles.index(a)
      i && i.positive? ? rc.article_drop(@b.articles[i - 1]) : nil
    end

    def previous_article
      a = rc.main_article
      i = a && @b.articles.index(a)
      i && @b.articles[i + 1] ? rc.article_drop(@b.articles[i + 1]) : nil
    end
  end

  class BlogsDrop < BaseDrop
    def liquid_method_missing(handle)
      b = rc.store.blog(handle.to_s)
      b && rc.blog_drop(b)
    end

    def size = rc.store.blogs.size
    def each(&) = rc.store.blogs.map { |b| rc.blog_drop(b) }.each(&)
  end

  class ArticleDrop < BaseDrop
    attr_reader :a

    def initialize(rc, article)
      super(rc)
      @a = article
    end

    def model_key = @a.id
    def id = @a.id
    def handle = "#{@a.blog.handle}/#{@a.handle}"
    def title = @a.title
    def url = "/blogs/#{@a.blog.handle}/#{@a.handle}"
    def author = @a.author
    def content = @a.body_html
    def excerpt = @a.summary_html
    def excerpt_or_content = @a.summary_html.to_s.strip.empty? ? @a.body_html : @a.summary_html
    def image = (@a.image && rc.image_drop(@a.image))
    def tags = @a.tags
    def published_at = @a.published_at
    def created_at = @a.created_at
    def updated_at = @a.updated_at
    def comments = PaginatedArray.build([])
    def comments_count = 0
    def comment_post_url = "#{url}/comments"
    def comments_enabled? = @a.blog.comments != 'disabled'
    def moderated? = @a.blog.comments == 'moderate'
    def blog = rc.blog_drop(@a.blog)
    def metafields = MetafieldsDrop.new(rc, @a.metafields)
    def template_suffix = @a.template_suffix
    def user = { 'first_name' => @a.author.to_s.split.first, 'last_name' => @a.author.to_s.split[1..]&.join(' '), 'name' => @a.author, 'bio' => nil, 'image' => nil }
    def object_type = 'article'
    def to_s = @a.title

    def as_json = { 'id' => id, 'title' => title, 'handle' => @a.handle, 'author' => author, 'url' => url, 'body_html' => content }
  end

  class ArticlesDrop < BaseDrop
    def liquid_method_missing(path)
      a = rc.store.article_by_path(path.to_s)
      a && rc.article_drop(a)
    end
  end

  class LinklistsDrop < BaseDrop
    def liquid_method_missing(handle)
      m = rc.store.menu(handle.to_s)
      m && LinklistDrop.new(rc, m)
    end

    def size = rc.store.menus.size
    def each(&) = rc.store.menus.map { |m| LinklistDrop.new(rc, m) }.each(&)
  end

  class LinklistDrop < BaseDrop
    def initialize(rc, menu)
      super(rc)
      @m = menu
    end

    def model_key = @m.handle
    def handle = @m.handle
    def title = @m.title
    def id = @m.id
    def links = @m.links.map { |l| LinkDrop.new(rc, l) }
    def size = @m.links.size

    def levels
      depth = lambda do |links|
        links.empty? ? 0 : 1 + links.map { |l| depth.call(l.links) }.max
      end
      depth.call(@m.links)
    end

    def empty? = @m.links.empty?
    def blank? = empty?
    def to_s = @m.handle
  end

  class LinkDrop < BaseDrop
    def initialize(rc, link)
      super(rc)
      @l = link
    end

    def model_key = @l.id
    def title = @l.title
    def url = @l.url
    def type = @l.type
    def handle = Util.handleize(@l.title)
    def links = @l.links.map { |x| LinkDrop.new(rc, x) }
    def to_s = @l.title

    def levels
      depth = lambda do |links|
        links.empty? ? 0 : 1 + links.map { |x| depth.call(x.links) }.max
      end
      depth.call(@l.links)
    end

    def object
      o = @l.object
      case o
      when Product then rc.product_drop(o)
      when Collection then rc.collection_drop(o)
      when Page then rc.page_drop(o)
      when Blog then rc.blog_drop(o)
      when Article then rc.article_drop(o)
      when Policy then PolicyDrop.new(rc, o)
      end
    end

    def current = self.class.current?(rc, @l)
    def active = self.class.active?(rc, @l)
    def child_current = self.class.any_desc?(@l) { |x| self.class.current?(rc, x) }
    def child_active = self.class.any_desc?(@l) { |x| self.class.active?(rc, x) }

    def self.current?(rc, l)
      path = rc.path.sub(%r{/\z}, '')
      path = '/' if path.empty?
      u = l.url.to_s.split('?').first.to_s.sub(%r{/\z}, '')
      u = '/' if u.empty?
      u == path
    end

    def self.active?(rc, l)
      return true if current?(rc, l)
      path = rc.path
      u = l.url.to_s.split('?').first.to_s
      return false if u.empty? || u == '/'
      # collection link is active on products within it (/collections/x/products/y)
      path.start_with?("#{u}/")
    end

    def self.any_desc?(l, &blk)
      l.links.any? { |x| blk.call(x) || any_desc?(x, &blk) }
    end
  end

  class PolicyDrop < BaseDrop
    def initialize(rc, pol)
      super(rc)
      @pol = pol
    end

    def model_key = @pol.handle
    def id = @pol.id
    def title = @pol.title
    def body = @pol.body
    def url = "/policies/#{@pol.handle}"
    def handle = @pol.handle
    def to_s = @pol.title
  end
end
