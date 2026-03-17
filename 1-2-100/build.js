/**
 * 包体优化构建脚本
 * 压缩代码、移除未使用代码、优化资源
 */

const fs = require('fs');
const path = require('path');
const CodeMinifier = require('./src/utils/code-minifier');
const ResourceOptimizer = require('./src/utils/resource-optimizer');
const DeadCodeEliminator = require('./src/utils/dead-code-eliminator');
const PackageAnalyzer = require('./src/utils/package-analyzer');

class PackageOptimizer {
  constructor() {
    this.sourceDir = './src';
    this.outputDir = './dist';
    this.mainFile = './game.js';
    this.configFile = './game.json';
    this.iconFile = './icon.png';
    
    // 需要包含在最终包中的核心文件
    this.coreFiles = [
      'game.js',
      'game.json',
      'icon.png',
      'project.config.json'
    ];
    
    // 需要排除的文件和目录
    this.excludePatterns = [
      'node_modules',
      '__tests__',
      'coverage',
      'docs',
      'examples',
      'backup',
      'java-springboot-demo',
      '*.md',
      '*.test.js',
      '*.spec.js',
      'package-lock.json',
      'TEST-*.md',
      'TROUBLESHOOTING.md',
      'CHANGELOG.md',
      'README.md'
    ];
  }
  
  async optimize() {
    console.log('🚀 开始包体优化...');
    
    // 1. 创建输出目录
    await this.createOutputDir();
    
    // 2. 压缩主要代码文件
    await this.compressMainCode();
    
    // 3. 复制必要的配置文件
    await this.copyEssentialFiles();
    
    // 4. 移除未使用的代码
    await this.removeUnusedCode();
    
    // 5. 优化图片资源
    await this.optimizeImages();
    
    // 6. 分析包体大小
    await this.analyzePackageSize();
    
    console.log('✅ 包体优化完成！');
  }
  
  async createOutputDir() {
    if (fs.existsSync(this.outputDir)) {
      fs.rmSync(this.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.outputDir, { recursive: true });
    console.log('📁 创建输出目录:', this.outputDir);
  }
  
  async compressMainCode() {
    console.log('🗜️ 复制主要代码文件...');
    
    // 读取主游戏文件
    const gameCode = fs.readFileSync(this.mainFile, 'utf8');
    
    // 直接复制，不进行任何压缩以避免语法错误
    let optimizedCode = gameCode;
    
    // 写入文件
    const outputPath = path.join(this.outputDir, 'game.js');
    fs.writeFileSync(outputPath, optimizedCode, 'utf8');
    
    const originalSize = gameCode.length;
    const compressedSize = optimizedCode.length;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`  原始大小: ${this.formatBytes(originalSize)}`);
    console.log(`  复制后: ${this.formatBytes(compressedSize)}`);
    console.log(`  节省: ${savings}%`);
  }
  
  compressJavaScript(code) {
    // 移除多行注释
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 移除单行注释（保留 URL 中的 //）
    code = code.replace(/\/\/(?![^\r\n]*['"`])[^\r\n]*/g, '');
    
    // 移除多余的空白字符，但保留必要的空格
    code = code.replace(/\s+/g, ' ');
    
    // 移除行首行尾空格
    code = code.replace(/^\s+|\s+$/gm, '');
    
    // 移除空行
    code = code.replace(/\n\s*\n/g, '\n');
    
    // 移除分号前的空格
    code = code.replace(/\s*;\s*/g, ';');
    
    // 移除逗号后多余空格（但保留一个空格）
    code = code.replace(/,\s+/g, ', ');
    
    // 保守处理操作符 - 只移除明显多余的空格，保留必要的空格
    // 不要移除 ++ 和 -- 操作符周围的空格
    code = code.replace(/\s*([=<>!])\s*/g, '$1');
    code = code.replace(/\s*([&|])\s*/g, '$1');
    
    // 移除括号内外多余空格
    code = code.replace(/\s*\(\s*/g, '(');
    code = code.replace(/\s*\)\s*/g, ')');
    code = code.replace(/\s*\{\s*/g, '{');
    code = code.replace(/\s*\}\s*/g, '}');
    code = code.replace(/\s*\[\s*/g, '[');
    code = code.replace(/\s*\]\s*/g, ']');
    
    return code.trim();
  }
  
  async copyEssentialFiles() {
    console.log('📋 复制必要文件...');
    
    for (const file of this.coreFiles) {
      if (file === 'game.js') continue; // 已经处理过了
      
      const sourcePath = path.join('.', file);
      const destPath = path.join(this.outputDir, file);
      
      if (fs.existsSync(sourcePath)) {
        // 确保目标目录存在
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  复制: ${file}`);
      }
    }
  }
  
  async removeUnusedCode() {
    console.log('🧹 移除未使用的代码...');
    
    const gameCodePath = path.join(this.outputDir, 'game.js');
    let gameCode = fs.readFileSync(gameCodePath, 'utf8');
    
    // 移除调试代码 - 使用更安全的正则表达式
    gameCode = gameCode.replace(/console\.log\([^;]*\);/g, '');
    gameCode = gameCode.replace(/console\.warn\([^;]*\);/g, '');
    gameCode = gameCode.replace(/console\.error\([^;]*\);/g, '');
    gameCode = gameCode.replace(/console\.debug\([^;]*\);/g, '');
    
    // 移除开发环境特定代码
    gameCode = gameCode.replace(/\/\*\s*DEV_START\s*\*\/[\s\S]*?\/\*\s*DEV_END\s*\*\//g, '');
    
    // 移除测试相关代码
    gameCode = gameCode.replace(/\/\*\s*TEST_START\s*\*\/[\s\S]*?\/\*\s*TEST_END\s*\*\//g, '');
    
    fs.writeFileSync(gameCodePath, gameCode, 'utf8');
    console.log('  移除调试和测试代码');
  }
  
  async optimizeImages() {
    console.log('🖼️ 优化图片资源...');
    
    const resourceOptimizer = new ResourceOptimizer();
    
    // 优化项目中的所有资源
    const assetsDir = './src/assets';
    if (fs.existsSync(assetsDir)) {
      const outputAssetsDir = path.join(this.outputDir, 'assets');
      await resourceOptimizer.optimizeResources(assetsDir, outputAssetsDir);
    }
    
    // 优化根目录的图标文件
    const iconPath = path.join('.', this.iconFile);
    const outputIconPath = path.join(this.outputDir, this.iconFile);
    
    if (fs.existsSync(iconPath)) {
      fs.copyFileSync(iconPath, outputIconPath);
      
      const iconSize = fs.statSync(iconPath).size;
      console.log(`  图标大小: ${this.formatBytes(iconSize)}`);
      
      if (iconSize > 50 * 1024) { // 50KB
        console.log('  ⚠️ 图标文件较大，建议进一步压缩');
        console.log('    - 使用在线工具如 TinyPNG 压缩');
        console.log('    - 考虑使用 WebP 格式');
        console.log('    - 减少图片尺寸');
      }
    }
  }
  
  async analyzePackageSize() {
    console.log('📊 分析包体大小...');
    
    const analyzer = new PackageAnalyzer();
    const analysis = analyzer.analyzePackage(this.outputDir);
    
    return {
      totalSize: analysis.totalSize,
      maxSize: analyzer.maxSize,
      files: analysis.files,
      withinLimit: analysis.totalSize <= analyzer.maxSize,
      analysis: analysis
    };
  }
  
  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        this.getAllFiles(filePath, fileList);
      } else {
        const relativePath = path.relative(this.outputDir, filePath);
        fileList.push(relativePath);
      }
    }
    
    return fileList;
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// 运行优化
if (require.main === module) {
  const optimizer = new PackageOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = PackageOptimizer;