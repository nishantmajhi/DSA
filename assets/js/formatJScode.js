/**
 * JavaScript Code Formatter - VS Code Style Syntax Highlighting
 * Formats JavaScript code in elements with class="javascript"
 */

class JSCodeFormatter {
  constructor() {
    this.colors = {
      keyword: "#f92672", // Monokai pink for keywords
      string: "#e6db74", // Monokai yellow for strings
      comment: "#b39c89", // Warm brown-grey for comments
      number: "#ae81ff", // Monokai purple for numbers
      function: "#a6e22e", // Monokai green for function names
      variable: "#f2ece4", // Coconut cream for variables
      operator: "#f2ece4", // Coconut cream for operators
      bracket: "#e6b450", // Warm gold for brackets
      property: "#66d9ef", // Monokai cyan for object properties
      boolean: "#ae81ff", // Monokai purple for booleans
      null: "#ae81ff", // Monokai purple for null/undefined
      regex: "#fd971f", // Monokai orange for regex
      className: "#66d9ef", // Monokai cyan for class names
      interpolation: "#ffd866", // Warm yellow for template literal interpolations
    };

    // JavaScript keywords
    this.keywords = new Set([
      "abstract",
      "arguments",
      "await",
      "boolean",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "class",
      "const",
      "continue",
      "debugger",
      "default",
      "delete",
      "do",
      "double",
      "else",
      "enum",
      "eval",
      "export",
      "extends",
      "false",
      "final",
      "finally",
      "float",
      "for",
      "function",
      "goto",
      "if",
      "implements",
      "import",
      "in",
      "instanceof",
      "int",
      "interface",
      "let",
      "long",
      "native",
      "new",
      "null",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "short",
      "static",
      "super",
      "switch",
      "synchronized",
      "this",
      "throw",
      "throws",
      "transient",
      "true",
      "try",
      "typeof",
      "var",
      "void",
      "volatile",
      "while",
      "with",
      "yield",
      "async",
      "of",
    ]);

    // Built-in objects and methods
    this.builtins = new Set([
      "Array",
      "Boolean",
      "Date",
      "Error",
      "Function",
      "Math",
      "Number",
      "Object",
      "RegExp",
      "String",
      "console",
      "document",
      "window",
      "localStorage",
      "sessionStorage",
      "JSON",
      "Promise",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      "parseInt",
      "parseFloat",
      "isNaN",
      "isFinite",
      "encodeURIComponent",
      "decodeURIComponent",
    ]);
  }

  /**
   * Format all JavaScript code blocks
   */
  formatAllCodeBlocks() {
    const codeBlocks = document.querySelectorAll("code.javascript");
    codeBlocks.forEach((block) => this.formatCodeBlock(block));
  }

  /**
   * Format a single code block
   */
  formatCodeBlock(codeElement) {
    const originalCode = codeElement.textContent;
    const formattedHTML = this.parseAndHighlight(originalCode);
    codeElement.innerHTML = formattedHTML;

    // Apply base styling
    this.applyBaseStyles(codeElement);
  }

  /**
   * Parse JavaScript code and apply syntax highlighting
   */
  parseAndHighlight(code) {
    let result = "";
    let i = 0;

    while (i < code.length) {
      const char = code[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        result += char;
        i++;
        continue;
      }

      // Comments
      if (char === "/" && i + 1 < code.length) {
        if (code[i + 1] === "/") {
          // Single line comment
          const comment = this.extractComment(code, i, "//");
          result += this.colorize(comment, "comment");
          i += comment.length;
          continue;
        } else if (code[i + 1] === "*") {
          // Multi-line comment
          const comment = this.extractComment(code, i, "/*");
          result += this.colorize(comment, "comment");
          i += comment.length;
          continue;
        }
      }

      // Strings
      if (char === '"' || char === "'" || char === "`") {
        const stringResult = this.extractString(code, i, char);

        if (typeof stringResult === "object" && stringResult.isPreProcessed) {
          // Template literal was pre-processed
          result += stringResult.content;
          i += stringResult.length;
        } else {
          // Regular string
          result += this.colorize(stringResult, "string");
          i += stringResult.length;
        }
        continue;
      }

      // Regular expressions
      if (char === "/" && this.isRegexContext(code, i)) {
        const regex = this.extractRegex(code, i);
        result += this.colorize(regex, "regex");
        i += regex.length;
        continue;
      }

      // Numbers
      if (/\d/.test(char) || (char === "." && /\d/.test(code[i + 1]))) {
        const number = this.extractNumber(code, i);
        result += this.colorize(number, "number");
        i += number.length;
        continue;
      }

      // Identifiers (keywords, functions, variables)
      if (/[a-zA-Z_$]/.test(char)) {
        const identifier = this.extractIdentifier(code, i);
        const colorType = this.getIdentifierType(identifier, code, i);
        result += this.colorize(identifier, colorType);
        i += identifier.length;
        continue;
      }

      // Brackets
      if (/[\[\]{}()]/.test(char)) {
        result += this.colorize(char, "bracket");
        i++;
        continue;
      }

      // Operators
      if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
        const operator = this.extractOperator(code, i);
        result += this.colorize(operator, "operator");
        i += operator.length;
        continue;
      }

      // Other characters
      result += char;
      i++;
    }

    return result;
  }

  /**
   * Extract comments from code
   */
  extractComment(code, start, type) {
    let end = start;
    if (type === "//") {
      while (end < code.length && code[end] !== "\n") {
        end++;
      }
      if (code[end] === "\n") end++;
    } else if (type === "/*") {
      end += 2; // Skip /*
      while (end < code.length - 1) {
        if (code[end] === "*" && code[end + 1] === "/") {
          end += 2;
          break;
        }
        end++;
      }
    }
    return code.substring(start, end);
  }

  /**
   * Extract strings from code
   */
  extractString(code, start, quote) {
    if (quote === "`") {
      // Handle template literals with interpolation
      return this.extractTemplateLiteral(code, start);
    }

    let end = start + 1;
    while (end < code.length) {
      if (code[end] === quote && code[end - 1] !== "\\") {
        end++;
        break;
      }
      if (code[end] === "\\") {
        end += 2; // Skip escaped character
      } else {
        end++;
      }
    }
    return code.substring(start, end);
  }

  /**
   * Extract and parse template literals with interpolation
   */
  extractTemplateLiteral(code, start) {
    let result = "";
    let i = start;

    // Add opening backtick
    result += this.colorize(code[i], "string");
    i++;

    while (i < code.length) {
      const char = code[i];

      if (char === "`") {
        // End of template literal
        result += this.colorize(char, "string");
        i++;
        break;
      } else if (char === "$" && i + 1 < code.length && code[i + 1] === "{") {
        // Start of interpolation
        result += this.colorize("${", "interpolation");
        i += 2;

        // Parse the interpolation content
        let braceCount = 1;
        let interpolationStart = i;

        while (i < code.length && braceCount > 0) {
          if (code[i] === "{") {
            braceCount++;
          } else if (code[i] === "}") {
            braceCount--;
          }
          i++;
        }

        // Extract and parse the interpolation content
        const interpolationCode = code.substring(interpolationStart, i - 1);
        const parsedInterpolation = this.parseAndHighlight(interpolationCode);
        result += parsedInterpolation;

        // Add closing brace
        result += this.colorize("}", "interpolation");
      } else {
        // Regular template literal character
        if (char === "\\" && i + 1 < code.length) {
          // Handle escaped characters
          result += this.colorize(code.substring(i, i + 2), "string");
          i += 2;
        } else {
          result += this.colorize(char, "string");
          i++;
        }
      }
    }

    // Return a special object to indicate this was pre-processed
    return {
      content: result,
      length: i - start,
      isPreProcessed: true,
    };
  }

  /**
   * Extract regular expressions
   */
  extractRegex(code, start) {
    let end = start + 1;
    while (end < code.length) {
      if (code[end] === "/" && code[end - 1] !== "\\") {
        end++;
        // Get flags
        while (end < code.length && /[gimuy]/.test(code[end])) {
          end++;
        }
        break;
      }
      if (code[end] === "\\") {
        end += 2;
      } else {
        end++;
      }
    }
    return code.substring(start, end);
  }

  /**
   * Check if / is starting a regex (not division)
   */
  isRegexContext(code, index) {
    // Simple heuristic: look for patterns that suggest regex
    const before = code.substring(0, index).trim();
    return (
      /[=([,;:!&|?+\-*/%^~<>]$/.test(before) ||
      /\b(return|throw)\s*$/.test(before) ||
      before === ""
    );
  }

  /**
   * Extract numbers from code
   */
  extractNumber(code, start) {
    let end = start;
    let hasDecimal = false;

    while (end < code.length) {
      const char = code[end];
      if (/\d/.test(char)) {
        end++;
      } else if (char === "." && !hasDecimal && /\d/.test(code[end + 1])) {
        hasDecimal = true;
        end++;
      } else if ((char === "e" || char === "E") && end > start) {
        end++;
        if (code[end] === "+" || code[end] === "-") end++;
      } else {
        break;
      }
    }

    return code.substring(start, end);
  }

  /**
   * Extract identifiers (words)
   */
  extractIdentifier(code, start) {
    let end = start;
    while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) {
      end++;
    }
    return code.substring(start, end);
  }

  /**
   * Extract operators
   */
  extractOperator(code, start) {
    const char = code[start];
    const nextChar = code[start + 1] || "";

    // Multi-character operators
    const twoChar = char + nextChar;
    if (
      [
        "++",
        "--",
        "&&",
        "||",
        "==",
        "!=",
        "<=",
        ">=",
        "=>",
        "===",
        "!==",
        "<<",
        ">>",
        ">>>",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "&=",
        "|=",
        "^=",
      ].includes(twoChar)
    ) {
      return twoChar;
    }

    return char;
  }

  /**
   * Determine the type of identifier for coloring
   */
  getIdentifierType(identifier, code, position) {
    // Check if it's a keyword
    if (this.keywords.has(identifier)) {
      return "keyword";
    }

    // Check for boolean literals
    if (identifier === "true" || identifier === "false") {
      return "boolean";
    }

    // Check for null/undefined
    if (identifier === "null" || identifier === "undefined") {
      return "null";
    }

    // Check if it's a built-in
    if (this.builtins.has(identifier)) {
      return "function";
    }

    // Check if it's a function call (followed by parentheses)
    const nextNonSpace = this.getNextNonSpaceChar(
      code,
      position + identifier.length
    );
    if (nextNonSpace === "(") {
      return "function";
    }

    // Check if it's a class name (starts with capital letter and not preceded by 'new')
    if (/^[A-Z]/.test(identifier)) {
      const prevWord = this.getPrevWord(code, position - 1);
      if (prevWord !== "new") {
        return "className";
      }
    }

    // Check if it's a property access (preceded by dot)
    const prevNonSpace = this.getPrevNonSpaceChar(code, position - 1);
    if (prevNonSpace === ".") {
      return "property";
    }

    // Default to variable
    return "variable";
  }

  /**
   * Get next non-whitespace character
   */
  getNextNonSpaceChar(code, start) {
    for (let i = start; i < code.length; i++) {
      if (!/\s/.test(code[i])) {
        return code[i];
      }
    }
    return "";
  }

  /**
   * Get previous non-whitespace character
   */
  getPrevNonSpaceChar(code, start) {
    for (let i = start; i >= 0; i--) {
      if (!/\s/.test(code[i])) {
        return code[i];
      }
    }
    return "";
  }

  /**
   * Get previous word (for class name detection)
   */
  getPrevWord(code, start) {
    let word = "";
    let i = start;

    // Skip whitespace
    while (i >= 0 && /\s/.test(code[i])) {
      i--;
    }

    // Extract word
    while (i >= 0 && /[a-zA-Z0-9_$]/.test(code[i])) {
      word = code[i] + word;
      i--;
    }

    return word;
  }

  /**
   * Wrap text with color span
   */
  colorize(text, type) {
    const color = this.colors[type] || "#D4D4D4";
    return `<span style="color: ${color}">${this.escapeHtml(text)}</span>`;
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Apply base styles to code element
   */
  applyBaseStyles(element) {
    Object.assign(element.style, {
      borderRadius: "0.5rem",
      padding: "1rem 1.5rem",
      display: "block",
      overflow: "auto",
      whiteSpace: "pre",
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "#f2ece4",
      backgroundColor: "#2b1810",
      fontFamily: 'Consolas, "Courier New", monospace',
    });
  }
}

// Export for manual use
window.JSCodeFormatter = JSCodeFormatter;
