/**
 * 包体验证脚本
 * 验证优化后的包体是否符合所有要求
 */

const fs = require('fs');
const path = require('path');

class PackageVerifier {
  constructor() {
    this.requirements = {
      maxSize: 4 * 1024 * 1024,      // 4MB
      maxSingleFile: 2 * 1024 * 1024, // 2MB
      requiredFiles: ['game.js', 'game.json', 'icon.png'],
      maxFiles: 20
    };
  }
  
  verify(packageDir = './dist') {
    console.log('🔍 开始包体验证...');
    console.log('='.repeat(50));
    
    const results = {
      passed: true,
      checks: [],
      warnings: [],
      errors: []
    };
    
    // 检查包体是否存在
    if (!fs.existsSync(packageDir)) {
      results.errors.push('包体目录不存在，请先运行构建');
      results.passed = false;
      return results;
    }
    
    // 获取所有文件
    const files = this.getAllFiles(packageDir);
    let totalSize = 0;
    
    // 计算总大小
    for (const file of files) {
      const filePath = path.join(packageDir, file);
      const size = fs.statSync(filePath).size;
      totalSize += size;
    }
    
    // 验证总大小
    this.checkTotalSize(totalSize, results);
    
    // 验证文件数量
    this.checkFileCount(files.length, results);
    
    // 验证必需文件
    this.checkRequiredFiles(files, results);
    
    // 验证单个文件大小
    this.checkIndividualFileSizes(packageDir, files, results);
    
    // 验证文件完整性
    this.checkFileIntegrity(packageDir, results);
    
    // 输出验证结果
    this.printResults(results, totalSize, files.length);
    
    return results;
  }
  
  checkTotalSize(totalSize, results) {
    const check = {
      name: '总包体大小',
      requirement: `≤ ${this.formatBytes(this.requirements.maxSize)}`,
      actual: this.formatBytes(totalSize),
      passed: totalSize <= this.requirements.maxSize
    };
    
    results.checks.push(check);
    
    if (!check.passed) {
      results.errors.push(`包体大小超出限制: ${check.actual} > ${check.requirement}`);
      results.passed = false;
    } else if (totalSize > this.requirements.maxSize * 0.8) {
      results.warnings.push(`包体大小接近限制: ${check.actual} (${(totalSize / this.requirements.maxSize * 100).toFixed(1)}%)`);
    }
  }
  
  checkFileCount(fileCount, results) {
    const check = {
      name: '文件数量',
      requirement: `≤ ${this.requirements.maxFiles}`,
      actual: fileCount,
      passed: fileCount <= this.requirements.maxFiles
    };
    
    results.checks.push(check);
    
    if (!check.passed) {
      results.errors.push(`文件数量过多: ${check.actual} > ${check.requirement}`);
      results.passed = false;
    }
  }
  
  checkRequiredFiles(files, results) {
    for (const requiredFile of this.requirements.requiredFiles) {
      const exists = files.includes(requiredFile);
      const check = {
        name: `必需文件: ${requiredFile}`,
        requirement: '存在',
        actual: exists ? '存在' : '缺失',
        passed: exists
      };
      
      results.checks.push(check);
      
      if (!check.passed) {
        results.errors.push(`缺少必需文件: ${requiredFile}`);
        results.passed = false;
      }
    }
  }
  
  checkIndividualFileSizes(packageDir, files, results) {
    for (const file of files) {
      const filePath = path.join(packageDir, file);
      const size = fs.statSync(filePath).size;
      
      const check = {
        name: `文件大小: ${file}`,
        requirement: `≤ ${this.formatBytes(this.requirements.maxSingleFile)}`,
        actual: this.formatBytes(size),
        passed: size <= this.requirements.maxSingleFile
      };
      
      results.checks.push(check);
      
      if (!check.passed) {
        results.errors.push(`单个文件过大: ${file} (${check.actual})`);
        results.passed = false;
      } else if (size > 500 * 1024) { // 500KB
        results.warnings.push(`文件较大: ${file} (${check.actual})`);
      }
    }
  }
  
  checkFileIntegrity(packageDir, results) {
    // 检查主游戏文件
    const gameJsPath = path.join(packageDir, 'game.js');
    if (fs.existsSync(gameJsPath)) {
      const content = fs.readFileSync(gameJsPath, 'utf8');
      
      // 检查是否包含基本的游戏逻辑
      const hasGameLogic = content.includes('class') || content.includes('function');
      const hasCanvasCode = content.includes('canvas') || content.includes('ctx');
      
      const integrityCheck = {
        name: '游戏文件完整性',
        requirement: '包含游戏逻辑',
        actual: hasGameLogic && hasCanvasCode ? '完整' : '可能不完整',
        passed: hasGameLogic && hasCanvasCode
      };
      
      results.checks.push(integrityCheck);
      
      if (!integrityCheck.passed) {
        results.warnings.push('游戏文件可能不完整，请检查压缩过程');
      }
    }
    
    // 检查配置文件
    const gameJsonPath = path.join(packageDir, 'game.json');
    if (fs.existsSync(gameJsonPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'));
        const configCheck = {
          name: '配置文件格式',
          requirement: '有效的 JSON',
          actual: '有效',
          passed: true
        };
        results.checks.push(configCheck);
      } catch (error) {
        const configCheck = {
          name: '配置文件格式',
          requirement: '有效的 JSON',
          actual: '无效',
          passed: false
        };
        results.checks.push(configCheck);
        results.errors.push('game.json 格式无效');
        results.passed = false;
      }
    }
  }
  
  printResults(results, totalSize, fileCount) {
    console.log(`\n📊 验证结果: ${results.passed ? '✅ 通过' : '❌ 失败'}`);
    console.log(`总大小: ${this.formatBytes(totalSize)}`);
    console.log(`文件数量: ${fileCount}`);
    
    console.log('\n📋 详细检查结果:');
    for (const check of results.checks) {
      const status = check.passed ? '✅' : '❌';
      console.log(`  ${status} ${check.name}: ${check.actual} (要求: ${check.requirement})`);
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      for (const warning of results.warnings) {
        console.log(`  - ${warning}`);
      }
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ 错误:');
      for (const error of results.errors) {
        console.log(`  - ${error}`);
      }
    }
    
    if (results.passed) {
      console.log('\n🎉 包体验证通过！可以发布到抖音小游戏平台。');
    } else {
      console.log('\n🚨 包体验证失败！请修复上述问题后重新构建。');
    }
    
    console.log('='.repeat(50));
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
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// 运行验证
if (require.main === module) {
  const verifier = new PackageVerifier();
  const results = verifier.verify();
  process.exit(results.passed ? 0 : 1);
}

module.exports = PackageVerifier;