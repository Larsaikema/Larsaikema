# frozen_string_literal: true

module Preview
  module Tags
    def self.unquote(s)
      s.to_s.strip.sub(/\A(['"])(.*)\1\z/m, '\2')
    end

    # {% schema %} / {% stylesheet %} / {% javascript %}: raw bodies, no output (collected separately).
    class RawNoOutput < Liquid::Raw
      def render_to_output_buffer(_context, output) = output
      def blank? = true
    end

    # {% style %}...{% endstyle %} → <style data-shopify>
    class Style < Liquid::Block
      def render_to_output_buffer(context, output)
        output << '<style data-shopify>'
        super
        output << '</style>'
        output
      end
    end

    # {% section 'name' %}
    class Section < Liquid::Tag
      def initialize(tag_name, markup, options)
        super
        @name = Tags.unquote(markup)
      end

      def render_to_output_buffer(context, output)
        output << context.registers[:rc].render_static_section(@name)
      end
    end

    # {% sections 'header-group' %}
    class Sections < Liquid::Tag
      def initialize(tag_name, markup, options)
        super
        @name = Tags.unquote(markup)
      end

      def render_to_output_buffer(context, output)
        output << context.registers[:rc].render_section_group(@name)
      end
    end

    # {% layout 'name' %} / {% layout none %}
    class Layout < Liquid::Tag
      def initialize(tag_name, markup, options)
        super
        m = markup.strip
        @name = %w[none nil].include?(m) ? nil : Tags.unquote(m)
      end

      def render_to_output_buffer(context, output)
        context.registers[:rc].layout = @name
        output
      end
    end

    # render with support for `{% render block %}` (app blocks → nothing locally) and global partial cache
    class Render < Liquid::Render
      def initialize(tag_name, markup, options)
        if markup.strip.match?(/\A[a-z_][\w.]*\s*\z/i)
          @app_block = true
          @tag_name = tag_name
          @markup = markup
          @parse_context = options
          @line_number = options.line_number
          @attributes = {}
          @template_name_expr = nil
          return
        end
        super
      end

      def render_to_output_buffer(context, output)
        return output if @app_block
        super
      end
    end

    # {% content_for 'blocks' %} / {% content_for 'block', type: 'x', id: 'y', closest.product: expr, foo: bar %}
    class ContentFor < Liquid::Tag
      ARG = /([\w.\-]+)\s*:\s*(#{Liquid::QuotedFragment})/o

      def initialize(tag_name, markup, options)
        super
        m = markup.match(/\A\s*(#{Liquid::QuotedString})\s*,?(.*)\z/om)
        raise Liquid::SyntaxError, "Syntax Error in 'content_for' - Valid syntax: content_for 'blocks' | 'block', type:, id:" unless m
        @kind = Tags.unquote(m[1])
        @args = {}
        m[2].scan(ARG) { |k, v| @args[k] = parse_expression(v) }
      end

      def render_to_output_buffer(context, output)
        rc = context.registers[:rc]
        case @kind
        when 'blocks'
          output << rc.render_blocks(context)
        when 'block'
          type = context.evaluate(@args['type']).to_s
          id = context.evaluate(@args['id']).to_s
          closest = {}
          vars = {}
          @args.each do |k, expr|
            next if %w[type id].include?(k)
            val = context.evaluate(expr)
            if k.start_with?('closest.')
              closest[k.sub('closest.', '')] = val
            else
              vars[k] = val
            end
          end
          output << rc.render_static_block(type, id, closest, vars, context)
        else
          raise Liquid::SyntaxError, "Unknown content_for type '#{@kind}'"
        end
        output
      end
    end

    # {% paginate collection.products by 12, window_size: 3 %}
    class Paginate < Liquid::Block
      SYNTAX = /(#{Liquid::QuotedFragment})\s*(?:by\s*(#{Liquid::QuotedFragment}))?/o

      def initialize(tag_name, markup, options)
        super
        m = markup.match(SYNTAX)
        raise Liquid::SyntaxError, "Syntax Error in 'paginate' - Valid syntax: paginate [collection] by number" unless m
        @collection = parse_expression(m[1])
        @by = m[2] ? parse_expression(m[2]) : nil
        @attrs = {}
        markup.scan(Liquid::TagAttributes) { |k, v| @attrs[k] = parse_expression(v) }
      end

      def render_to_output_buffer(context, output)
        rc = context.registers[:rc]
        list = context.evaluate(@collection)
        per = @by ? context.evaluate(@by).to_i : 20
        per = 20 if per <= 0
        per = 250 if per > 250
        window = @attrs['window_size'] ? context.evaluate(@attrs['window_size']).to_i : 3
        page = [rc.query_param('page').to_i, 1].max
        total = list.is_a?(PaginatedArray) ? list.total : Array(list).size
        pd = PaginateDrop.new(rc, total, per, page, window)
        list.paginate!(pd.current_offset, per) if list.is_a?(PaginatedArray)
        context.stack do
          context['paginate'] = pd
          super
        end
        output
      ensure
        list.unpaginate! if list.is_a?(PaginatedArray)
      end
    end

    # {% form 'type', object, attr: value %}
    class Form < Liquid::Block
      def initialize(tag_name, markup, options)
        super
        m = markup.match(/\A\s*(#{Liquid::QuotedString})\s*(?:,\s*([^,:]+?)\s*(?=,|\z))?(.*)\z/om)
        raise Liquid::SyntaxError, "Syntax Error in 'form' - Valid syntax: form 'type'[, object]" unless m
        @type = Tags.unquote(m[1])
        @object = m[2] && !m[2].strip.empty? ? parse_expression(m[2].strip) : nil
        @attrs = {}
        rest = m[2] && m[2].include?(':') ? "#{m[2]}#{m[3]}" : m[3]
        rest.to_s.scan(/([\w\-]+)\s*:\s*(#{Liquid::QuotedFragment})/o) { |k, v| @attrs[k] = parse_expression(v) }
      end

      DEFAULTS = {
        'product' => ['/cart/add', 'product_form', 'shopify-product-form', 'multipart/form-data'],
        'cart' => ['/cart', 'cart', nil, nil],
        'contact' => ['/contact', 'contact_form', 'contact-form', nil],
        'customer' => ['/contact', 'contact_form', 'contact-form', nil],
        'create_customer' => ['/account', 'create_customer', nil, nil],
        'customer_login' => ['/account/login', 'customer_login', nil, nil],
        'recover_customer_password' => ['/account/recover', 'recover_customer_password', nil, nil],
        'reset_customer_password' => ['/account/reset', 'reset_customer_password', nil, nil],
        'activate_customer_password' => ['/account/activate', 'activate_customer_password', nil, nil],
        'guest_login' => ['/account/login', 'customer_login_guest', nil, nil],
        'customer_address' => ['/account/addresses', 'address_form_new', nil, nil],
        'localization' => ['/localization', 'localization_form', 'shopify-localization-form', 'multipart/form-data'],
        'currency' => ['/cart/update', 'currency_form', 'shopify-currency-form', 'multipart/form-data'],
        'storefront_password' => ['/password', 'login_form', 'storefront-password-form', nil],
        'new_comment' => [nil, 'comment_form', 'comment-form', nil]
      }.freeze

      def render_to_output_buffer(context, output)
        rc = context.registers[:rc]
        obj = @object ? context.evaluate(@object) : nil
        attrs = @attrs.transform_values { |v| context.evaluate(v) }
        action, def_id, def_class, enctype = DEFAULTS[@type] || ['/', "#{@type}_form", nil, nil]
        action = "#{obj.url}/comments" if @type == 'new_comment' && obj.respond_to?(:url)
        id = attrs.delete('id') || (@type == 'product' && obj.respond_to?(:id) ? "product_form_#{obj.id}" : def_id)
        klass = attrs.key?('class') ? attrs.delete('class') : def_class
        action = attrs.delete('action') if attrs['action']
        action = "#{action}##{id}" if %w[contact customer new_comment].include?(@type)
        method_attr = 'post'
        html = +%(<form method="#{method_attr}" action="#{Util.h(action)}" id="#{Util.h(id)}" accept-charset="UTF-8")
        html << %( class="#{Util.h(klass)}") if klass && !klass.to_s.empty?
        html << %( enctype="#{enctype}") if enctype
        attrs.each do |k, v|
          next if %w[return_to].include?(k)
          next if v.nil? || v == false
          html << (v == true ? " #{k}" : %( #{k}="#{Util.h(v)}"))
        end
        html << '>'
        html << %(<input type="hidden" name="form_type" value="#{@type}" /><input type="hidden" name="utf8" value="✓" />)
        case @type
        when 'product'
          rc.current_form_variant_id = obj.respond_to?(:selected_or_first_available_variant) ? obj.selected_or_first_available_variant&.id : nil
        when 'localization', 'currency'
          html << %(<input type="hidden" name="_method" value="put" /><input type="hidden" name="return_to" value="#{Util.h(attrs['return_to'] || rc.path)}" />)
        when 'customer_login', 'create_customer'
          html << %(<input type="hidden" name="return_to" value="#{Util.h(attrs['return_to'])}" />) if attrs['return_to']
        when 'new_comment'
          html << ''
        end
        form = rc.form_drop(@type, id, obj)
        output << html
        context.stack do
          context['form'] = form
          @body.render_to_output_buffer(context, output)
        end
        output << '</form>'
        output
      end
    end
  end
end
