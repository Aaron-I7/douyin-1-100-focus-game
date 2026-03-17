/**
 * 高级代码压缩器
 * 专门针对游戏代码进行优化
 */

class CodeMinifier {
  constructor() {
    // 保留的关键字和API调用
    this.preservedAPIs = [
      'tt.', 'canvas.', 'ctx.', 'Math.', 'Date.', 'JSON.',
      'setTimeout', 'setInterval', 'requestAnimationFrame',
      'addEventListener', 'removeEventListener'
    ];
    
    // 可以缩短的变量名映射
    this.variableMap = new Map();
    this.shortNameCounter = 0;
  }
  
  minify(code) {
    console.log('🔧 开始高级代码压缩...');
    
    // 1. 移除注释和空白
    code = this.removeCommentsAndWhitespace(code);
    
    // 2. 压缩变量名
    code = this.compressVariableNames(code);
    
    // 3. 优化字符串
    code = this.optimizeStrings(code);
    
    // 4. 移除未使用的函数
    code = this.removeUnusedFunctions(code);
    
    // 5. 内联简单函数
    code = this.inlineSimpleFunctions(code);
    
    // 6. 优化数学运算
    code = this.optimizeMathOperations(code);
    
    return code;
  }
  
  removeCommentsAndWhitespace(code) {
    // 移除多行注释
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 移除单行注释（保留URL中的//）
    code = code.replace(/\/\/(?![^\r\n]*['"`])[^\r\n]*/g, '');
    
    // 移除多余的空白字符，但保留字符串内的空格和必要的操作符空格
    let inString = false;
    let stringChar = '';
    let result = '';
    let lastChar = '';
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1];
      
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        result += char;
      } else if (inString && char === stringChar && lastChar !== '\\') {
        inString = false;
        stringChar = '';
        result += char;
      } else if (inString) {
        result += char;
      } else {
        // 不在字符串内，可以压缩空白
        if (/\s/.test(char)) {
          // 检查是否需要保留空格
          if (this.shouldPreserveSpace(lastChar, nextChar, result)) {
            result += ' ';
          }
        } else {
          result += char;
        }
      }
      
      lastChar = char;
    }
    
    return result;
  }
  
  shouldPreserveSpace(prevChar, nextChar, currentResult) {
    if (!nextChar || !prevChar) return false;
    
    // 保留操作符周围的空格以避免语法错误
    const operators = ['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|'];
    const isOperatorContext = operators.includes(prevChar) || operators.includes(nextChar);
    
    // 特别处理数字和变量名的组合，避免 col.5 这样的错误
    const isNumberVariableCombo = (
      (/[a-zA-Z_$]/.test(prevChar) && /[0-9.]/.test(nextChar)) ||
      (/[0-9.]/.test(prevChar) && /[a-zA-Z_$]/.test(nextChar))
    );
    
    // 保留关键字后的空格
    const isKeywordContext = /[a-zA-Z_$]/.test(prevChar) && /[a-zA-Z_$]/.test(nextChar);
    
    // 特别处理 ++ 和 -- 操作符
    const isPlusPlusOrMinusMinus = (
      (prevChar === '+' && nextChar === '+') ||
      (prevChar === '-' && nextChar === '-') ||
      (prevChar === '+' && /[a-zA-Z_$]/.test(nextChar)) ||
      (prevChar === '-' && /[a-zA-Z_$]/.test(nextChar))
    );
    
    return isOperatorContext || isNumberVariableCombo || isKeywordContext || isPlusPlusOrMinusMinus;
  }
  
  needsSpace(prevChar, nextChar) {
    if (!nextChar) return false;
    
    // 在某些情况下需要保留空格以避免语法错误
    const needsSpacePatterns = [
      // 关键字后面
      /[a-zA-Z_$]/.test(prevChar) && /[a-zA-Z_$]/.test(nextChar),
      // 数字后面跟字母
      /\d/.test(prevChar) && /[a-zA-Z_$]/.test(nextChar),
      // return, throw 等关键字后
      prevChar === 'n' && nextChar !== '(' && nextChar !== '.' && nextChar !== '[',
      // 变量名后面跟数字（避免 col.5 这样的错误）
      /[a-zA-Z_$]/.test(prevChar) && /\d/.test(nextChar),
    ];
    
    return needsSpacePatterns.some(pattern => pattern);
  }
  
  compressVariableNames(code) {
    // 查找所有变量声明
    const variablePattern = /\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const variables = new Set();
    
    let match;
    while ((match = variablePattern.exec(code)) !== null) {
      const varName = match[2];
      // 不压缩保留的API名称
      if (!this.isPreservedName(varName)) {
        variables.add(varName);
      }
    }
    
    // 为变量生成短名称
    for (const varName of variables) {
      if (!this.variableMap.has(varName)) {
        this.variableMap.set(varName, this.generateShortName());
      }
    }
    
    // 替换变量名
    for (const [longName, shortName] of this.variableMap) {
      const regex = new RegExp(`\\b${longName}\\b`, 'g');
      code = code.replace(regex, shortName);
    }
    
    return code;
  }
  
  isPreservedName(name) {
    return this.preservedAPIs.some(api => name.startsWith(api.replace('.', ''))) ||
           name.length <= 2 || // 已经很短的名称
           /^[A-Z_]+$/.test(name); // 常量名称
  }
  
  generateShortName() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    let num = this.shortNameCounter++;
    
    do {
      name = chars[num % 26] + name;
      num = Math.floor(num / 26);
    } while (num > 0);
    
    return name;
  }
  
  optimizeStrings(code) {
    // 合并重复的字符串字面量
    const stringMap = new Map();
    const strings = code.match(/(["'`])((?:(?!\1)[^\\]|\\.)*)(\1)/g) || [];
    
    // 统计字符串使用频率
    for (const str of strings) {
      const count = stringMap.get(str) || 0;
      stringMap.set(str, count + 1);
    }
    
    // 对于使用频率高的字符串，考虑提取为变量
    const frequentStrings = Array.from(stringMap.entries())
      .filter(([str, count]) => count > 3 && str.length > 10)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [str, count] of frequentStrings.slice(0, 5)) {
      const varName = this.generateShortName();
      code = `const ${varName}=${str};` + code;
      const regex = new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      code = code.replace(regex, varName);
    }
    
    return code;
  }
  
  removeUnusedFunctions(code) {
    // 查找所有函数定义
    const functionPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    const definedFunctions = new Set();
    
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      definedFunctions.add(match[1]);
    }
    
    // 查找函数调用
    const usedFunctions = new Set();
    for (const funcName of definedFunctions) {
      const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      if (callPattern.test(code)) {
        usedFunctions.add(funcName);
      }
    }
    
    // 移除未使用的函数
    for (const funcName of definedFunctions) {
      if (!usedFunctions.has(funcName)) {
        const funcPattern = new RegExp(
          `function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}`,
          'g'
        );
        code = code.replace(funcPattern, '');
      }
    }
    
    return code;
  }
  
  inlineSimpleFunctions(code) {
    // 内联简单的单行函数
    const simpleFunctionPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*([^)]*)\s*\)\s*\{\s*return\s+([^;]+);\s*\}/g;
    const inlineFunctions = new Map();
    
    let match;
    while ((match = simpleFunctionPattern.exec(code)) !== null) {
      const [fullMatch, funcName, params, returnExpr] = match;
      inlineFunctions.set(funcName, { params: params.split(',').map(p => p.trim()), returnExpr });
      
      // 移除函数定义
      code = code.replace(fullMatch, '');
    }
    
    // 替换函数调用
    for (const [funcName, { params, returnExpr }] of inlineFunctions) {
      const callPattern = new RegExp(`\\b${funcName}\\s*\\(([^)]*)\\)`, 'g');
      code = code.replace(callPattern, (match, args) => {
        let inlinedExpr = returnExpr;
        const argList = args.split(',').map(a => a.trim());
        
        for (let i = 0; i < params.length && i < argList.length; i++) {
          if (params[i]) {
            const paramPattern = new RegExp(`\\b${params[i]}\\b`, 'g');
            inlinedExpr = inlinedExpr.replace(paramPattern, argList[i]);
          }
        }
        
        return `(${inlinedExpr})`;
      });
    }
    
    return code;
  }
  
  optimizeMathOperations(code) {
    // 优化常见的数学运算
    const optimizations = [
      // Math.pow(x, 2) -> x*x
      [/Math\.pow\s*\(\s*([^,]+)\s*,\s*2\s*\)/g, '($1)*($1)'],
      // Math.pow(x, 3) -> x*x*x
      [/Math\.pow\s*\(\s*([^,]+)\s*,\s*3\s*\)/g, '($1)*($1)*($1)'],
      // Math.pow(x, 0.5) -> Math.sqrt(x)
      [/Math\.pow\s*\(\s*([^,]+)\s*,\s*0\.5\s*\)/g, 'Math.sqrt($1)'],
      // x * 1 -> x
      [/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\*\s*1\b/g, '$1'],
      // x / 1 -> x
      [/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\/\s*1\b/g, '$1'],
      // x + 0 -> x
      [/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*0\b/g, '$1'],
      // x - 0 -> x
      [/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*-\s*0\b/g, '$1'],
    ];
    
    for (const [pattern, replacement] of optimizations) {
      code = code.replace(pattern, replacement);
    }
    
    return code;
  }
}

module.exports = CodeMinifier;