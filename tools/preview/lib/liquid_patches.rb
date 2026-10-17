# frozen_string_literal: true

module Liquid
  # Use the theme's mtime-keyed parse cache for snippets (render/include) instead of per-render parsing.
  class PartialCache
    class << self
      alias preview_original_load load

      def load(template_name, context:, parse_context:)
        fs = context.registers[:file_system]
        if fs.respond_to?(:cached_partial)
          begin
            return fs.cached_partial(template_name)
          rescue Liquid::Error => e
            e.template_name ||= "snippets/#{template_name}.liquid" if e.is_a?(Liquid::SyntaxError)
            raise e
          end
        end
        preview_original_load(template_name, context: context, parse_context: parse_context)
      end
    end
  end

  class Context
    alias preview_original_handle_error handle_error

    def handle_error(e, line_number = nil)
      rc = registers[:rc]
      rc&.note_internal(e, template_name, line_number) unless e.is_a?(Liquid::Error)
      msg = preview_original_handle_error(e, line_number)
      rc&.record_error(msg.to_s)
      msg
    end
  end
end
