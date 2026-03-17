/**
 * 性能基准测试工具
 * 用于在实际游戏运行时监控和测试性能
 */

class PerformanceBenchmark {
  constructor() {
    this.metrics = {
      voronoi: {
        generationTimes: [],
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      touch: {
        responseTimes: [],
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity,
        cacheHitRate: 0
      },
      render: {
        frameTimes: [],
        averageFPS: 0,
        minFPS: Infinity,
        maxFPS: 0,
        droppedFrames: 0
      },
      memory: {
        peakUsage: 0,
        gcCount: 0,
        animationCount: 0,
        cacheSize: 0
      }
    };
    
    this.isRunning = false;
    this.startTime = 0;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    
    // 性能阈值
    this.thresholds = {
      voronoiGeneration: 500,    // ms
      touchResponse: 50,         // ms
      minFPS: 55,               // fps
      maxMemoryUsage: 0.8       // 80% of available memory
    };
    
    // 警告回调
    this.onPerformanceWarning = null;
  }
  
  /**
   * 开始性能监控
   */
  start() {
    this.isRunning = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFrameTime = this.startTime;
    
    console.log('Performance benchmark started');
  }
  
  /**
   * 停止性能监控
   */
  stop() {
    this.isRunning = false;
    console.log('Performance benchmark stopped');
    this.generateReport();
  }
  
  /**
   * 记录 Voronoi 生成性能
   */
  recordVoronoiGeneration(generationTime, cellCount) {
    if (!this.isRunning) return;
    
    const metrics = this.metrics.voronoi;
    metrics.generationTimes.push(generationTime);
    metrics.maxTime = Math.max(metrics.maxTime, generationTime);
    metrics.minTime = Math.min(metrics.minTime, generationTime);
    metrics.averageTime = metrics.generationTimes.reduce((a, b) => a + b, 0) / metrics.generationTimes.length;
    
    // 检查性能阈值
    if (generationTime > this.thresholds.voronoiGeneration) {
      this.triggerWarning('voronoi', `Generation time ${generationTime.toFixed(2)}ms exceeds threshold ${this.thresholds.voronoiGeneration}ms`);
    }
    
    console.log(`Voronoi generation (${cellCount} cells): ${generationTime.toFixed(2)}ms`);
  }
  
  /**
   * 记录触摸响应性能
   */
  recordTouchResponse(responseTime, cacheHitRate = 0) {
    if (!this.isRunning) return;
    
    const metrics = this.metrics.touch;
    metrics.responseTimes.push(responseTime);
    metrics.maxTime = Math.max(metrics.maxTime, responseTime);
    metrics.minTime = Math.min(metrics.minTime, responseTime);
    metrics.averageTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    metrics.cacheHitRate = cacheHitRate;
    
    // 检查性能阈值
    if (responseTime > this.thresholds.touchResponse) {
      this.triggerWarning('touch', `Touch response time ${responseTime.toFixed(2)}ms exceeds threshold ${this.thresholds.touchResponse}ms`);
    }
  }
  
  /**
   * 记录渲染性能
   */
  recordRenderFrame(frameTime) {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      const metrics = this.metrics.render;
      
      metrics.frameTimes.push(frameTime);
      metrics.maxFPS = Math.max(metrics.maxFPS, fps);
      metrics.minFPS = Math.min(metrics.minFPS, fps);
      
      // 计算平均FPS
      this.frameCount++;
      const totalTime = currentTime - this.startTime;
      metrics.averageFPS = (this.frameCount / totalTime) * 1000;
      
      // 检查掉帧
      if (fps < this.thresholds.minFPS) {
        metrics.droppedFrames++;
        this.triggerWarning('render', `FPS dropped to ${fps.toFixed(1)}, below threshold ${this.thresholds.minFPS}`);
      }
    }
  }
  
  /**
   * 记录内存使用情况
   */
  recordMemoryUsage(memoryInfo) {
    if (!this.isRunning) return;
    
    const metrics = this.metrics.memory;
    
    if (memoryInfo.peakUsage) {
      metrics.peakUsage = Math.max(metrics.peakUsage, memoryInfo.peakUsage);
    }
    
    if (memoryInfo.gcCount !== undefined) {
      metrics.gcCount = memoryInfo.gcCount;
    }
    
    if (memoryInfo.animationCount !== undefined) {
      metrics.animationCount = memoryInfo.animationCount;
    }
    
    if (memoryInfo.cacheSize !== undefined) {
      metrics.cacheSize = memoryInfo.cacheSize;
    }
    
    // 检查内存使用阈值
    if (memoryInfo.peakUsage > this.thresholds.maxMemoryUsage) {
      this.triggerWarning('memory', `Memory usage ${(memoryInfo.peakUsage * 100).toFixed(1)}% exceeds threshold ${(this.thresholds.maxMemoryUsage * 100)}%`);
    }
  }
  
  /**
   * 触发性能警告
   */
  triggerWarning(category, message) {
    console.warn(`Performance Warning [${category}]: ${message}`);
    
    if (this.onPerformanceWarning) {
      this.onPerformanceWarning(category, message);
    }
  }
  
  /**
   * 获取实时性能指标
   */
  getCurrentMetrics() {
    return {
      ...this.metrics,
      isRunning: this.isRunning,
      uptime: this.isRunning ? performance.now() - this.startTime : 0,
      frameCount: this.frameCount
    };
  }
  
  /**
   * 生成性能报告
   */
  generateReport() {
    const totalTime = performance.now() - this.startTime;
    const report = {
      summary: {
        totalTime: totalTime,
        frameCount: this.frameCount,
        averageFPS: (this.frameCount / totalTime) * 1000
      },
      voronoi: {
        totalGenerations: this.metrics.voronoi.generationTimes.length,
        averageTime: this.metrics.voronoi.averageTime,
        maxTime: this.metrics.voronoi.maxTime,
        minTime: this.metrics.voronoi.minTime === Infinity ? 0 : this.metrics.voronoi.minTime,
        passedThreshold: this.metrics.voronoi.averageTime <= this.thresholds.voronoiGeneration
      },
      touch: {
        totalResponses: this.metrics.touch.responseTimes.length,
        averageTime: this.metrics.touch.averageTime,
        maxTime: this.metrics.touch.maxTime,
        minTime: this.metrics.touch.minTime === Infinity ? 0 : this.metrics.touch.minTime,
        cacheHitRate: this.metrics.touch.cacheHitRate,
        passedThreshold: this.metrics.touch.averageTime <= this.thresholds.touchResponse
      },
      render: {
        averageFPS: this.metrics.render.averageFPS,
        minFPS: this.metrics.render.minFPS === Infinity ? 0 : this.metrics.render.minFPS,
        maxFPS: this.metrics.render.maxFPS,
        droppedFrames: this.metrics.render.droppedFrames,
        frameDropRate: this.frameCount > 0 ? (this.metrics.render.droppedFrames / this.frameCount) * 100 : 0,
        passedThreshold: this.metrics.render.averageFPS >= this.thresholds.minFPS
      },
      memory: {
        peakUsage: this.metrics.memory.peakUsage,
        gcCount: this.metrics.memory.gcCount,
        animationCount: this.metrics.memory.animationCount,
        cacheSize: this.metrics.memory.cacheSize,
        passedThreshold: this.metrics.memory.peakUsage <= this.thresholds.maxMemoryUsage
      },
      overallScore: this.calculateOverallScore()
    };
    
    console.log('Performance Report:', report);
    return report;
  }
  
  /**
   * 计算总体性能评分
   */
  calculateOverallScore() {
    let score = 100;
    
    // Voronoi 生成性能 (20%)
    if (this.metrics.voronoi.averageTime > this.thresholds.voronoiGeneration) {
      score -= 20 * (this.metrics.voronoi.averageTime / this.thresholds.voronoiGeneration - 1);
    }
    
    // 触摸响应性能 (30%)
    if (this.metrics.touch.averageTime > this.thresholds.touchResponse) {
      score -= 30 * (this.metrics.touch.averageTime / this.thresholds.touchResponse - 1);
    }
    
    // 渲染性能 (40%)
    if (this.metrics.render.averageFPS < this.thresholds.minFPS) {
      score -= 40 * (1 - this.metrics.render.averageFPS / this.thresholds.minFPS);
    }
    
    // 内存使用 (10%)
    if (this.metrics.memory.peakUsage > this.thresholds.maxMemoryUsage) {
      score -= 10 * (this.metrics.memory.peakUsage / this.thresholds.maxMemoryUsage - 1);
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * 重置所有指标
   */
  reset() {
    this.metrics = {
      voronoi: {
        generationTimes: [],
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      touch: {
        responseTimes: [],
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity,
        cacheHitRate: 0
      },
      render: {
        frameTimes: [],
        averageFPS: 0,
        minFPS: Infinity,
        maxFPS: 0,
        droppedFrames: 0
      },
      memory: {
        peakUsage: 0,
        gcCount: 0,
        animationCount: 0,
        cacheSize: 0
      }
    };
    
    this.frameCount = 0;
    this.startTime = 0;
    this.lastFrameTime = 0;
  }
  
  /**
   * 设置性能阈值
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
  
  /**
   * 设置警告回调
   */
  setWarningCallback(callback) {
    this.onPerformanceWarning = callback;
  }
  
  /**
   * 导出性能数据为JSON
   */
  exportData() {
    return JSON.stringify({
      metrics: this.metrics,
      thresholds: this.thresholds,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    }, null, 2);
  }
  
  /**
   * 创建性能监控面板（用于调试）
   */
  createDebugPanel() {
    if (typeof document === 'undefined') return null;
    
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      border-radius: 5px;
    `;
    
    const updatePanel = () => {
      if (!this.isRunning) return;
      
      const metrics = this.getCurrentMetrics();
      panel.innerHTML = `
        <div><strong>Performance Monitor</strong></div>
        <div>FPS: ${metrics.render.averageFPS.toFixed(1)}</div>
        <div>Frame Time: ${metrics.render.frameTimes.length > 0 ? metrics.render.frameTimes[metrics.render.frameTimes.length - 1].toFixed(2) : 0}ms</div>
        <div>Touch Avg: ${metrics.touch.averageTime.toFixed(2)}ms</div>
        <div>Cache Hit: ${(metrics.touch.cacheHitRate * 100).toFixed(1)}%</div>
        <div>Voronoi Avg: ${metrics.voronoi.averageTime.toFixed(2)}ms</div>
        <div>Memory Peak: ${(metrics.memory.peakUsage * 100).toFixed(1)}%</div>
        <div>Animations: ${metrics.memory.animationCount}</div>
        <div>Uptime: ${(metrics.uptime / 1000).toFixed(1)}s</div>
      `;
    };
    
    // 每秒更新一次
    const updateInterval = setInterval(updatePanel, 1000);
    
    // 清理函数
    panel.destroy = () => {
      clearInterval(updateInterval);
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    };
    
    document.body.appendChild(panel);
    return panel;
  }
}

// 单例实例
let benchmarkInstance = null;

/**
 * 获取性能基准测试实例
 */
function getPerformanceBenchmark() {
  if (!benchmarkInstance) {
    benchmarkInstance = new PerformanceBenchmark();
  }
  return benchmarkInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceBenchmark, getPerformanceBenchmark };
}

if (typeof global !== 'undefined') {
  global.PerformanceBenchmark = PerformanceBenchmark;
  global.getPerformanceBenchmark = getPerformanceBenchmark;
}