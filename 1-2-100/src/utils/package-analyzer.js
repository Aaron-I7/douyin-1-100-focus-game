/**
 * 包体分析器
 * 详细分析包体组成和优化建议
 */

const fs = require('fs');
const path = require('path');

class PackageAnalyzer {
  constructor() {
    this.maxSize = 4 * 1024 * 1024; // 4MB
    this.warningThresholds = {
      singleFile: 500 * 1024,    // 500KB
      totalJS: 2 * 1024 * 1024,  // 2MB
      totalAssets: 1 * 1024 * 1024 // 1MB
    };
  }
  
  analyzePackage(packageDir) {
    console.log('📊 开始详细包体分析...');
    
    const analysis = {
      totalSize: 0,
      files: [],
      categories: {
        javascript: { size: 0, files: [] },
        images: { size: 0, files: [] },
        fonts: { size: 0, files: [] },
        config: { size: 0, files: [] },
        other: { size: 0, files: [] }
      },
      warnings: [],
      recommendations: []
    };
    
    // 分析所有文件
    this.analyzeDirectory(packageDir, '', analysis);
    
    // 生成警告和建议
    this.generateWarningsAndRecommendations(analysis);
    
    // 输出分析报告
    this.printAnalysisReport(analysis);
    
    return analysis;
  }
  
  analyzeDirectory(dir, relativePath, analysis) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      if (fs.statSync(itemPath).isDirectory()) {
        this.analyzeDirectory(itemPath, itemRelativePath, analysis);
      } else {
        this.analyzeFile(itemPath, itemRelativePath, analysis);
      }
    }
  }
  
  analyzeFile(filePath, relativePath, analysis) {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const ext = path.extname(relativePath).toLowerCase();
    
    const fileInfo = {
      path: relativePath,
      size: size,
      percentage: 0 // 稍后计算
    };
    
    analysis.totalSize += size;
    analysis.files.push(fileInfo);
    
    // 按类别分类
    if (ext === '.js') {
      analysis.categories.javascript.size += size;
      analysis.categories.javascript.files.push(fileInfo);
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
      analysis.categories.images.size += size;
      analysis.categories.images.files.push(fileInfo);
    } else if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
      analysis.categories.fonts.size += size;
      analysis.categories.fonts.files.push(fileInfo);
    } else if (['.json', '.xml', '.config'].includes(ext) || relativePath.includes('config')) {
      analysis.categories.config.size += size;
      analysis.categories.config.files.push(fileInfo);
    } else {
      analysis.categories.other.size += size;
      analysis.categories.other.files.push(fileInfo);
    }
  }
  
  generateWarningsAndRecommendations(analysis) {
    // 检查总大小
    if (analysis.totalSize > this.maxSize) {
      analysis.warnings.push({
        type: 'size_exceeded',
        message: `包体大小超出限制 (${this.formatBytes(analysis.totalSize)} > ${this.formatBytes(this.maxSize)})`,
        severity: 'error'
      });
    } else if (analysis.totalSize > this.maxSize * 0.8) {
      analysis.warnings.push({
        type: 'size_warning',
        message: `包体大小接近限制 (${this.formatBytes(analysis.totalSize)} / ${this.formatBytes(this.maxSize)})`,
        severity: 'warning'
      });
    }
    
    // 检查单个文件大小
    for (const file of analysis.files) {
      if (file.size > this.warningThresholds.singleFile) {
        analysis.warnings.push({
          type: 'large_file',
          message: `文件 ${file.path} 较大 (${this.formatBytes(file.size)})`,
          severity: 'warning'
        });
      }
    }
    
    // 检查 JavaScript 文件总大小
    if (analysis.categories.javascript.size > this.warningThresholds.totalJS) {
      analysis.warnings.push({
        type: 'large_js',
        message: `JavaScript 文件总大小较大 (${this.formatBytes(analysis.categories.javascript.size)})`,
        severity: 'warning'
      });
    }
    
    // 生成优化建议
    this.generateOptimizationRecommendations(analysis);
  }
  
  generateOptimizationRecommendations(analysis) {
    const recommendations = analysis.recommendations;
    
    // JavaScript 优化建议
    if (analysis.categories.javascript.size > 100 * 1024) {
      recommendations.push({
        category: 'javascript',
        message: '进一步压缩 JavaScript 代码',
        actions: [
          '使用更激进的代码压缩',
          '移除未使用的函数和变量',
          '考虑代码分割和懒加载'
        ]
      });
    }
    
    // 图片优化建议
    if (analysis.categories.images.size > 200 * 1024) {
      recommendations.push({
        category: 'images',
        message: '优化图片资源',
        actions: [
          '使用 WebP 格式',
          '压缩图片质量',
          '使用雪碧图合并小图标',
          '考虑使用 SVG 替代位图'
        ]
      });
    }
    
    // 字体优化建议
    if (analysis.categories.fonts.size > 100 * 1024) {
      recommendations.push({
        category: 'fonts',
        message: '优化字体文件',
        actions: [
          '使用 WOFF2 格式',
          '子集化字体（仅包含需要的字符）',
          '考虑使用系统字体',
          '移除未使用的字体文件'
        ]
      });
    }
    
    // 通用建议
    if (analysis.files.length > 20) {
      recommendations.push({
        category: 'general',
        message: '减少文件数量',
        actions: [
          '合并小文件',
          '移除不必要的配置文件',
          '使用内联资源'
        ]
      });
    }
  }
  
  printAnalysisReport(analysis) {
    console.log('\n📋 详细包体分析报告');
    console.log('='.repeat(60));
    
    // 总体信息
    console.log(`\n📦 总体信息:`);
    console.log(`  总大小: ${this.formatBytes(analysis.totalSize)}`);
    console.log(`  文件数量: ${analysis.files.length}`);
    console.log(`  大小限制: ${this.formatBytes(this.maxSize)}`);
    console.log(`  剩余空间: ${this.formatBytes(this.maxSize - analysis.totalSize)}`);
    console.log(`  使用率: ${(analysis.totalSize / this.maxSize * 100).toFixed(1)}%`);
    
    // 按类别分析
    console.log(`\n📊 按类别分析:`);
    for (const [category, data] of Object.entries(analysis.categories)) {
      if (data.size > 0) {
        const percentage = (data.size / analysis.totalSize * 100).toFixed(1);
        console.log(`  ${category.padEnd(12)}: ${this.formatBytes(data.size).padEnd(10)} (${percentage}%) - ${data.files.length} 文件`);
      }
    }
    
    // 最大的文件
    console.log(`\n📄 最大的文件 (前5个):`);
    const sortedFiles = [...analysis.files].sort((a, b) => b.size - a.size);
    for (let i = 0; i < Math.min(5, sortedFiles.length); i++) {
      const file = sortedFiles[i];
      const percentage = (file.size / analysis.totalSize * 100).toFixed(1);
      console.log(`  ${(i + 1)}. ${file.path.padEnd(30)} ${this.formatBytes(file.size).padEnd(10)} (${percentage}%)`);
    }
    
    // 警告
    if (analysis.warnings.length > 0) {
      console.log(`\n⚠️ 警告 (${analysis.warnings.length}):`);
      for (const warning of analysis.warnings) {
        const icon = warning.severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} ${warning.message}`);
      }
    }
    
    // 优化建议
    if (analysis.recommendations.length > 0) {
      console.log(`\n💡 优化建议:`);
      for (const rec of analysis.recommendations) {
        console.log(`  📌 ${rec.message}:`);
        for (const action of rec.actions) {
          console.log(`     - ${action}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

module.exports = PackageAnalyzer;