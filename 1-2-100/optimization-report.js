/**
 * 优化报告生成器
 * 生成详细的包体优化报告
 */

const fs = require('fs');
const path = require('path');
const PackageOptimizer = require('./build');

class OptimizationReporter {
  constructor() {
    this.reportPath = './optimization-report.md';
  }
  
  async generateReport() {
    console.log('📝 生成优化报告...');
    
    const optimizer = new PackageOptimizer();
    
    // 分析原始包体
    const originalAnalysis = this.analyzeOriginalPackage();
    
    // 运行优化
    await optimizer.optimize();
    
    // 分析优化后的包体
    const optimizedAnalysis = this.analyzeOptimizedPackage();
    
    // 生成报告
    const report = this.createReport(originalAnalysis, optimizedAnalysis);
    
    // 写入报告文件
    fs.writeFileSync(this.reportPath, report, 'utf8');
    
    console.log(`✅ 优化报告已生成: ${this.reportPath}`);
    
    return report;
  }
  
  analyzeOriginalPackage() {
    const analysis = {
      totalSize: 0,
      files: [],
      mainFileSize: 0
    };
    
    // 分析主要文件
    const mainFiles = ['game.js', 'game.json', 'icon.png', 'project.config.json'];
    
    for (const file of mainFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        analysis.files.push({
          name: file,
          size: stats.size
        });
        analysis.totalSize += stats.size;
        
        if (file === 'game.js') {
          analysis.mainFileSize = stats.size;
        }
      }
    }
    
    return analysis;
  }
  
  analyzeOptimizedPackage() {
    const distDir = './dist';
    const analysis = {
      totalSize: 0,
      files: [],
      mainFileSize: 0
    };
    
    if (fs.existsSync(distDir)) {
      const files = this.getAllFiles(distDir);
      
      for (const file of files) {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        
        analysis.files.push({
          name: file,
          size: stats.size
        });
        analysis.totalSize += stats.size;
        
        if (file === 'game.js') {
          analysis.mainFileSize = stats.size;
        }
      }
    }
    
    return analysis;
  }
  
  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        this.getAllFiles(filePath, fileList);
      } else {
        const relativePath = path.relative(dir, filePath);
        fileList.push(relativePath);
      }
    }
    
    return fileList;
  }
  
  createReport(original, optimized) {
    const totalSavings = original.totalSize > 0 ? 
      ((original.totalSize - optimized.totalSize) / original.totalSize * 100).toFixed(1) : 0;
    
    const mainFileSavings = original.mainFileSize > 0 ? 
      ((original.mainFileSize - optimized.mainFileSize) / original.mainFileSize * 100).toFixed(1) : 0;
    
    const maxSize = 4 * 1024 * 1024; // 4MB
    const withinLimit = optimized.totalSize <= maxSize;
    
    return `# 包体优化报告

## 优化概览

- **优化时间**: ${new Date().toLocaleString()}
- **总体节省**: ${totalSavings}%
- **主文件节省**: ${mainFileSavings}%
- **包体限制**: ${this.formatBytes(maxSize)}
- **符合限制**: ${withinLimit ? '✅ 是' : '❌ 否'}

## 大小对比

### 总体大小
- **优化前**: ${this.formatBytes(original.totalSize)}
- **优化后**: ${this.formatBytes(optimized.totalSize)}
- **节省**: ${this.formatBytes(original.totalSize - optimized.totalSize)} (${totalSavings}%)

### 主要文件对比
| 文件 | 优化前 | 优化后 | 节省 |
|------|--------|--------|------|
${this.generateFileComparisonTable(original.files, optimized.files)}

## 优化措施

### 已实施的优化
- ✅ 代码压缩和混淆
- ✅ 移除注释和空白字符
- ✅ 死代码消除
- ✅ 变量名压缩
- ✅ 移除调试代码
- ✅ 资源优化

### 优化效果
- **JavaScript 压缩**: ${mainFileSavings}% 节省
- **总包体压缩**: ${totalSavings}% 节省

## 包体组成分析

### 优化后文件列表
${optimized.files.map(file => 
  `- **${file.name}**: ${this.formatBytes(file.size)} (${(file.size / optimized.totalSize * 100).toFixed(1)}%)`
).join('\n')}

## 性能指标

- **包体大小**: ${this.formatBytes(optimized.totalSize)} / ${this.formatBytes(maxSize)} (${(optimized.totalSize / maxSize * 100).toFixed(1)}%)
- **剩余空间**: ${this.formatBytes(maxSize - optimized.totalSize)}
- **文件数量**: ${optimized.files.length}

## 建议和后续优化

${this.generateRecommendations(optimized)}

## 技术细节

### 使用的优化工具
- **CodeMinifier**: 高级 JavaScript 代码压缩
- **DeadCodeEliminator**: 死代码消除
- **ResourceOptimizer**: 资源文件优化
- **PackageAnalyzer**: 包体分析

### 优化配置
- 移除所有注释和调试代码
- 压缩变量名和函数名
- 优化数学运算表达式
- 内联简单函数
- 合并重复字符串

---
*报告生成时间: ${new Date().toISOString()}*
`;
  }
  
  generateFileComparisonTable(originalFiles, optimizedFiles) {
    const originalMap = new Map(originalFiles.map(f => [f.name, f.size]));
    const optimizedMap = new Map(optimizedFiles.map(f => [f.name, f.size]));
    
    const allFiles = new Set([...originalMap.keys(), ...optimizedMap.keys()]);
    
    return Array.from(allFiles).map(fileName => {
      const originalSize = originalMap.get(fileName) || 0;
      const optimizedSize = optimizedMap.get(fileName) || 0;
      const savings = originalSize > 0 ? 
        ((originalSize - optimizedSize) / originalSize * 100).toFixed(1) : 0;
      
      return `| ${fileName} | ${this.formatBytes(originalSize)} | ${this.formatBytes(optimizedSize)} | ${savings}% |`;
    }).join('\n');
  }
  
  generateRecommendations(optimized) {
    const recommendations = [];
    
    if (optimized.totalSize > 3 * 1024 * 1024) { // 3MB
      recommendations.push('- 考虑进一步压缩代码');
      recommendations.push('- 评估是否可以移除更多功能');
    }
    
    if (optimized.files.length > 10) {
      recommendations.push('- 考虑合并更多文件');
    }
    
    const largeFiles = optimized.files.filter(f => f.size > 100 * 1024);
    if (largeFiles.length > 0) {
      recommendations.push(`- 进一步优化大文件: ${largeFiles.map(f => f.name).join(', ')}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- 当前优化已达到较好效果，建议保持现状');
      recommendations.push('- 定期检查新增代码对包体大小的影响');
    }
    
    return recommendations.join('\n');
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// 运行报告生成
if (require.main === module) {
  const reporter = new OptimizationReporter();
  reporter.generateReport().catch(console.error);
}

module.exports = OptimizationReporter;