/**
 * 死代码消除器
 * 分析和移除未使用的代码
 */

class DeadCodeEliminator {
  constructor() {
    this.usedFunctions = new Set();
    this.usedVariables = new Set();
    this.usedClasses = new Set();
  }
  
  eliminate(code) {
    console.log('🗑️ 开始死代码消除...');
    
    // 1. 分析代码使用情况
    this.analyzeUsage(code);
    
    // 2. 移除未使用的函数
    code = this.removeUnusedFunctions(code);
    
    // 3. 移除未使用的变量
    code = this.removeUnusedVariables(code);
    
    // 4. 移除未使用的类
    code = this.removeUnusedClasses(code);
    
    // 5. 移除空的代码块
    code = this.removeEmptyBlocks(code);
    
    return code;
  }
  
  analyzeUsage(code) {
    // 分析函数调用
    const functionCalls = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || [];
    functionCalls.forEach(call => {
      const funcName = call.replace(/\s*\($/, '');
      this.usedFunctions.add(funcName);
    });
    
    // 分析变量使用
    const variableUsage = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
    variableUsage.forEach(variable => {
      this.usedVariables.add(variable);
    });
    
    // 分析类实例化
    const classInstances = code.match(/new\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
    classInstances.forEach(instance => {
      const className = instance.replace(/^new\s+/, '');
      this.usedClasses.add(className);
    });
  }
  
  removeUnusedFunctions(code) {
    const functionPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    
    return code.replace(functionPattern, (match, funcName) => {
      return this.usedFunctions.has(funcName) ? match : '';
    });
  }
  
  removeUnusedVariables(code) {
    const varPattern = /(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=[^;]+;/g;
    
    return code.replace(varPattern, (match, keyword, varName) => {
      return this.usedVariables.has(varName) ? match : '';
    });
  }
  
  removeUnusedClasses(code) {
    const classPattern = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:extends\s+[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    
    return code.replace(classPattern, (match, className) => {
      return this.usedClasses.has(className) ? match : '';
    });
  }
  
  removeEmptyBlocks(code) {
    // 移除空的函数体
    code = code.replace(/\{\s*\}/g, '{}');
    
    // 移除连续的空行
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return code;
  }
}

module.exports = DeadCodeEliminator;