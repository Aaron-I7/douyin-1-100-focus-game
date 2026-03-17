/**
 * 内存管理器
 * 负责优化内存使用，及时清理动画对象，限制动画队列长度，定期触发垃圾回收
 */

class MemoryManager {
  constructor() {
    // 内存监控
    this.memoryMetrics = {
      animationCount: 0,
      cacheSize: 0,
      lastGCTime: 0,
      gcCount: 0,
      peakMemoryUsage: 0
    };
    
    // 配置参数
    this.config = {
      maxAnimations: 30,           // 最大动画数量
      maxCacheSize: 100,           // 最大缓存大小
      gcInterval: 5000,            // GC间隔（毫秒）
      memoryCheckInterval: 1000,   // 内存检查间隔
      lowMemoryThreshold: 0.8      // 低内存阈值（80%）
    };
    
    // 管理的对象引用
    this.managedObjects = new Set();
    this.animationQueues = new Map();
    this.caches = new Map();
    
    // 定时器
    this.memoryCheckTimer = null;
    this.gcTimer = null;
    
    this.startMemoryMonitoring();
  }
  
  /**
   * 开始内存监控
   */
  startMemoryMonitoring() {
    // 定期检查内存使用情况
    this.memoryCheckTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.memoryCheckInterval);
    
    // 定期触发垃圾回收
    this.gcTimer = setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);
  }
  
  /**
   * 检查内存使用情况
   */
  checkMemoryUsage() {
    try {
      // 获取内存信息（如果支持）
      let memoryInfo = null;
      
      if (typeof performance !== 'undefined' && performance.memory) {
        memoryInfo = performance.memory;
      } else if (typeof tt !== 'undefined' && tt.getSystemInfo) {
        // 抖音小游戏环境
        const systemInfo = tt.getSystemInfoSync();
        memoryInfo = {
          usedJSHeapSize: 0,
          totalJSHeapSize: systemInfo.memorySize || 0,
          jsHeapSizeLimit: systemInfo.memorySize || 0
        };
      }
      
      if (memoryInfo) {
        const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        this.memoryMetrics.peakMemoryUsage = Math.max(
          this.memoryMetrics.peakMemoryUsage,
          memoryUsageRatio
        );
        
        // 如果内存使用率过高，触发清理
        if (memoryUsageRatio > this.config.lowMemoryThreshold) {
          console.warn(`High memory usage detected: ${(memoryUsageRatio * 100).toFixed(1)}%`);
          this.performEmergencyCleanup();
        }
      }
      
      // 更新指标
      this.updateMemoryMetrics();
      
    } catch (error) {
      console.warn('Memory check failed:', error);
    }
  }
  
  /**
   * 更新内存指标
   */
  updateMemoryMetrics() {
    this.memoryMetrics.animationCount = this.getTotalAnimationCount();
    this.memoryMetrics.cacheSize = this.getTotalCacheSize();
  }
  
  /**
   * 获取总动画数量
   */
  getTotalAnimationCount() {
    let total = 0;
    for (const queue of this.animationQueues.values()) {
      if (queue && Array.isArray(queue)) {
        total += queue.length;
      }
    }
    return total;
  }
  
  /**
   * 获取总缓存大小
   */
  getTotalCacheSize() {
    let total = 0;
    for (const cache of this.caches.values()) {
      if (cache && cache.size) {
        total += cache.size;
      }
    }
    return total;
  }
  
  /**
   * 注册动画队列
   */
  registerAnimationQueue(name, queue) {
    this.animationQueues.set(name, queue);
  }
  
  /**
   * 注册缓存
   */
  registerCache(name, cache) {
    this.caches.set(name, cache);
  }
  
  /**
   * 注册需要管理的对象
   */
  registerManagedObject(obj) {
    this.managedObjects.add(obj);
  }
  
  /**
   * 取消注册对象
   */
  unregisterManagedObject(obj) {
    this.managedObjects.delete(obj);
  }
  
  /**
   * 清理动画队列
   */
  cleanupAnimations() {
    let cleanedCount = 0;
    
    for (const [name, queue] of this.animationQueues.entries()) {
      if (!queue || !Array.isArray(queue)) continue;
      
      const originalLength = queue.length;
      
      // 限制动画数量
      if (queue.length > this.config.maxAnimations) {
        queue.splice(0, queue.length - this.config.maxAnimations);
        cleanedCount += originalLength - queue.length;
      }
      
      // 清理过期动画
      const now = Date.now();
      const validAnimations = queue.filter(anim => {
        if (!anim || !anim.startTime || !anim.duration) return false;
        return (now - anim.startTime) < anim.duration;
      });
      
      cleanedCount += queue.length - validAnimations.length;
      queue.length = 0;
      queue.push(...validAnimations);
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} animations`);
    }
    
    return cleanedCount;
  }
  
  /**
   * 清理缓存
   */
  cleanupCaches() {
    let cleanedCount = 0;
    
    for (const [name, cache] of this.caches.entries()) {
      if (!cache) continue;
      
      const originalSize = cache.size || 0;
      
      // 限制缓存大小
      if (cache.size > this.config.maxCacheSize) {
        if (cache instanceof Map) {
          // 删除最旧的条目（简单LRU）
          const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - this.config.maxCacheSize);
          for (const key of keysToDelete) {
            cache.delete(key);
          }
        } else if (cache.clear) {
          // 如果是其他类型的缓存，直接清空
          cache.clear();
        }
      }
      
      cleanedCount += originalSize - (cache.size || 0);
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} cache entries`);
    }
    
    return cleanedCount;
  }
  
  /**
   * 清理托管对象
   */
  cleanupManagedObjects() {
    let cleanedCount = 0;
    
    for (const obj of this.managedObjects) {
      try {
        // 调用对象的清理方法（如果存在）
        if (typeof obj.cleanup === 'function') {
          obj.cleanup();
          cleanedCount++;
        } else if (typeof obj.destroy === 'function') {
          obj.destroy();
          cleanedCount++;
        } else if (typeof obj.clear === 'function') {
          obj.clear();
          cleanedCount++;
        }
      } catch (error) {
        console.warn('Failed to cleanup managed object:', error);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} managed objects`);
    }
    
    return cleanedCount;
  }
  
  /**
   * 执行垃圾回收
   */
  performGarbageCollection() {
    const startTime = performance.now();
    
    // 清理动画
    const animationsCleaned = this.cleanupAnimations();
    
    // 清理缓存
    const cachesCleaned = this.cleanupCaches();
    
    // 清理托管对象
    const objectsCleaned = this.cleanupManagedObjects();
    
    // 手动触发垃圾回收（如果支持）
    this.triggerNativeGC();
    
    const gcTime = performance.now() - startTime;
    this.memoryMetrics.lastGCTime = gcTime;
    this.memoryMetrics.gcCount++;
    
    console.log(`GC completed in ${gcTime.toFixed(2)}ms: ${animationsCleaned} animations, ${cachesCleaned} cache entries, ${objectsCleaned} objects cleaned`);
  }
  
  /**
   * 触发原生垃圾回收
   */
  triggerNativeGC() {
    try {
      // 尝试触发垃圾回收（不同环境的方法）
      if (typeof gc === 'function') {
        gc();
      } else if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      } else if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    } catch (error) {
      // 垃圾回收不可用，忽略错误
    }
  }
  
  /**
   * 紧急清理（内存不足时）
   */
  performEmergencyCleanup() {
    console.warn('Performing emergency memory cleanup');
    
    // 更激进的清理策略
    const originalMaxAnimations = this.config.maxAnimations;
    const originalMaxCacheSize = this.config.maxCacheSize;
    
    // 临时降低限制
    this.config.maxAnimations = Math.floor(this.config.maxAnimations * 0.5);
    this.config.maxCacheSize = Math.floor(this.config.maxCacheSize * 0.5);
    
    // 执行清理
    this.performGarbageCollection();
    
    // 恢复原始配置
    this.config.maxAnimations = originalMaxAnimations;
    this.config.maxCacheSize = originalMaxCacheSize;
  }
  
  /**
   * 获取内存使用报告
   */
  getMemoryReport() {
    const report = {
      metrics: { ...this.memoryMetrics },
      config: { ...this.config },
      managedObjectCount: this.managedObjects.size,
      animationQueueCount: this.animationQueues.size,
      cacheCount: this.caches.size
    };
    
    // 添加系统内存信息（如果可用）
    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        report.systemMemory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          usageRatio: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
        };
      }
    } catch (error) {
      // 忽略错误
    }
    
    return report;
  }
  
  /**
   * 设置配置
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * 强制执行垃圾回收
   */
  forceGarbageCollection() {
    this.performGarbageCollection();
  }
  
  /**
   * 停止内存监控
   */
  stopMemoryMonitoring() {
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }
    
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }
  
  /**
   * 销毁内存管理器
   */
  destroy() {
    this.stopMemoryMonitoring();
    
    // 最后一次清理
    this.performGarbageCollection();
    
    // 清理引用
    this.managedObjects.clear();
    this.animationQueues.clear();
    this.caches.clear();
  }
}

// 单例模式
let memoryManagerInstance = null;

/**
 * 获取内存管理器实例
 */
function getMemoryManager() {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
  }
  return memoryManagerInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MemoryManager, getMemoryManager };
}

if (typeof global !== 'undefined') {
  global.MemoryManager = MemoryManager;
  global.getMemoryManager = getMemoryManager;
}