require "strscan"
class StringScanner
  unless method_defined?(:peek_byte)
    def peek_byte
      string.getbyte(pos)
    end
  end
  unless method_defined?(:scan_byte)
    def scan_byte
      b = string.getbyte(pos)
      self.pos += 1 if b
      b
    end
  end
end
