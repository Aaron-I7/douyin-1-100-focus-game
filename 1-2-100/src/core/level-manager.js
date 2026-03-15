/**
 * 关卡管理器
 * 负责关卡配置、状态管理和进度跟踪
 */

class LevelManager {
  constructor() {
    // 关卡配置
    this.levels = {
      1: {
        id: 1,
        name: '第一关',
        description: '热身练习：1-10',
        cellCount: 10,
        numberRange: { min: 1, max: 10 },
        unlocked: true,
        completed: false
      },
      2: {
        id: 2,
        name: '第二关',
        description: '终极挑战：1-100',
        cellCount: 100,
        numberRange: { min: 1, max: 100 },
        unlocked: false,
        completed: false
      }
    };
    
    // 当前关卡
    this.currentLevel = 1;
    
    // 关卡状态
    this.levelStates = {
      1: { completed: false, bestTime: null, bestErrors: null },
      2: { completed: false, bestTime: null, bestErrors: null }
    };
  }

  /**
   * 获取当前关卡配置
   */
  getCurrentLevelConfig() {
    return this.levels[this.currentLevel];
  }

  /**
   * 获取指定关卡配置
   */
  getLevelConfig(levelId) {
    return this.levels[levelId];
  }

  /**
   * 设置当前关卡
   */
  setCurrentLevel(levelId) {
    if (this.levels[levelId] && this.levels[levelId].unlocked) {
      this.currentLevel = levelId;
      return true;
    }
    return false;
  }

  /**
   * 检查关卡是否解锁
   */
  isLevelUnlocked(levelId) {
    return this.levels[levelId] && this.levels[levelId].unlocked;
  }

  /**
   * 检查关卡是否完成
   */
  isLevelCompleted(levelId) {
    return this.levelStates[levelId] && this.levelStates[levelId].completed;
  }

  /**
   * 完成关卡
   */
  completeLevel(levelId, stats) {
    if (!this.levels[levelId]) return false;

    const levelState = this.levelStates[levelId];
    
    // 标记为完成
    levelState.completed = true;
    this.levels[levelId].completed = true;

    // 更新最佳成绩
    if (!levelState.bestTime || stats.time < levelState.bestTime) {
      levelState.bestTime = stats.time;
    }
    
    if (!levelState.bestErrors || stats.errors < levelState.bestErrors) {
      levelState.bestErrors = stats.errors;
    }

    // 解锁下一关
    const nextLevelId = levelId + 1;
    if (this.levels[nextLevelId]) {
      this.levels[nextLevelId].unlocked = true;
    }

    console.log(`Level ${levelId} completed!`, {
      stats,
      bestTime: levelState.bestTime,
      bestErrors: levelState.bestErrors
    });

    return true;
  }

  /**
   * 获取关卡状态
   */
  getLevelState(levelId) {
    return this.levelStates[levelId];
  }

  /**
   * 获取所有关卡状态
   */
  getAllLevelStates() {
    return {
      levels: this.levels,
      states: this.levelStates,
      currentLevel: this.currentLevel
    };
  }

  /**
   * 重置关卡进度（用于测试）
   */
  resetProgress() {
    this.currentLevel = 1;
    
    // 重置关卡解锁状态
    this.levels[1].unlocked = true;
    this.levels[1].completed = false;
    this.levels[2].unlocked = false;
    this.levels[2].completed = false;
    
    // 重置关卡状态
    this.levelStates = {
      1: { completed: false, bestTime: null, bestErrors: null },
      2: { completed: false, bestTime: null, bestErrors: null }
    };
  }

  /**
   * 获取下一个未完成的关卡
   */
  getNextUncompletedLevel() {
    for (let levelId = 1; levelId <= 2; levelId++) {
      if (this.levels[levelId].unlocked && !this.levelStates[levelId].completed) {
        return levelId;
      }
    }
    return null; // 所有关卡都已完成
  }

  /**
   * 检查是否所有关卡都已完成
   */
  areAllLevelsCompleted() {
    return this.levelStates[1].completed && this.levelStates[2].completed;
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.LevelManager = LevelManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelManager;
}