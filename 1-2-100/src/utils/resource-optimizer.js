/**
 * 资源优化器
 * 优化图片、字体等资源文件
 */

const fs = require('fs');
const path = require('path');

class ResourceOptimizer {
  constructor() {
    this.supportedImageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    this.supportedFontTypes = ['.ttf', '.otf', '.woff', '.woff2'];
  }
  
  async optimizeResources(sourceDir, outputDir) {
    console.log('🎨 开始资源优化...');
    
    const resources = this.findResources(sourceDir);
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    for (const resource of resources) {
      const sourcePath = path.join(sourceDir, resource);
      const outputPath = path.join(outputDir, resource);
      
      // 确保输出目录存在
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
      
      const originalSize = fs.statSync(sourcePath).size;
      totalOriginalSize += originalSize;
      
      const ext = path.extname(resource).toLowerCase();
      
      if (this.supportedImageTypes.includes(ext)) {
        await this.optimizeImage(sourcePath, outputPath);
      } else if (this.supportedFontTypes.includes(ext)) {
        await this.optimizeFont(sourcePath, outputPath);
      } else {
        // 直接复制其他文件
        fs.copyFileSync(sourcePath, outputPath);
      }
      
      const optimizedSize = fs.statSync(outputPath).size;
      totalOptimizedSize += optimizedSize;
      
      const savings = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize * 100).toFixed(1) : 0;
      console.log(`  ${resource}: ${this.formatBytes(originalSize)} → ${this.formatBytes(optimizedSize)} (${savings}%)`);
    }
    
    const totalSavings = totalOriginalSize > 0 ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1) : 0;
    console.log(`📊 资源优化完成: ${this.formatBytes(totalOriginalSize)} → ${this.formatBytes(totalOptimizedSize)} (节省 ${totalSavings}%)`);
    
    return {
      originalSize: totalOriginalSize,
      optimizedSize: totalOptimizedSize,
      savings: totalSavings
    };
  }
  
  findResources(dir, basePath = '') {
    const resources = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      
      if (fs.statSync(itemPath).isDirectory()) {
        resources.push(...this.findResources(itemPath, relativePath));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (this.supportedImageTypes.includes(ext) || this.supportedFontTypes.includes(ext)) {
          resources.push(relativePath);
        }
      }
    }
    
    return resources;
  }
  
  async optimizeImage(sourcePath, outputPath) {
    // 简化的图片优化（在实际项目中可以使用 sharp 或其他图片处理库）
    const stats = fs.statSync(sourcePath);
    const ext = path.extname(sourcePath).toLowerCase();
    
    if (ext === '.png') {
      await this.optimizePNG(sourcePath, outputPath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await this.optimizeJPEG(sourcePath, outputPath);
    } else {
      // 其他格式直接复制
      fs.copyFileSync(sourcePath, outputPath);
    }
  }
  
  async optimizePNG(sourcePath, outputPath) {
    // PNG 优化策略
    const buffer = fs.readFileSync(sourcePath);
    
    // 检查文件大小，如果太大则建议转换为 JPEG
    if (buffer.length > 100 * 1024) { // 100KB
      console.log(`  ⚠️ PNG 文件较大 (${this.formatBytes(buffer.length)})，建议考虑转换为 JPEG`);
    }
    
    // 简单复制（实际项目中应该使用专业的 PNG 优化工具）
    fs.copyFileSync(sourcePath, outputPath);
  }
  
  async optimizeJPEG(sourcePath, outputPath) {
    // JPEG 优化策略
    const buffer = fs.readFileSync(sourcePath);
    
    // 检查文件大小
    if (buffer.length > 200 * 1024) { // 200KB
      console.log(`  ⚠️ JPEG 文件较大 (${this.formatBytes(buffer.length)})，建议降低质量或尺寸`);
    }
    
    // 简单复制（实际项目中应该使用 JPEG 压缩）
    fs.copyFileSync(sourcePath, outputPath);
  }
  
  async optimizeFont(sourcePath, outputPath) {
    const stats = fs.statSync(sourcePath);
    const ext = path.extname(sourcePath).toLowerCase();
    
    // 字体文件优化建议
    if (stats.size > 200 * 1024) { // 200KB
      console.log(`  ⚠️ 字体文件较大 (${this.formatBytes(stats.size)})，建议：`);
      console.log(`    - 使用 WOFF2 格式`);
      console.log(`    - 子集化字体（仅包含需要的字符）`);
      console.log(`    - 考虑使用系统字体`);
    }
    
    // 简单复制
    fs.copyFileSync(sourcePath, outputPath);
  }
  
  generateOptimizationReport(resources) {
    const report = {
      totalFiles: resources.length,
      imageFiles: 0,
      fontFiles: 0,
      recommendations: []
    };
    
    for (const resource of resources) {
      const ext = path.extname(resource).toLowerCase();
      
      if (this.supportedImageTypes.includes(ext)) {
        report.imageFiles++;
      } else if (this.supportedFontTypes.includes(ext)) {
        report.fontFiles++;
      }
    }
    
    // 生成优化建议
    if (report.imageFiles > 5) {
      report.recommendations.push('考虑使用雪碧图合并小图标');
    }
    
    if (report.fontFiles > 2) {
      report.recommendations.push('考虑减少字体文件数量');
    }
    
    return report;
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

module.exports = ResourceOptimizer;