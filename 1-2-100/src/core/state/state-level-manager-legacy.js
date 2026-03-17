class LevelManager {
  constructor(unlockSystem = null) {
    this.unlockSystem = unlockSystem;
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
    this.currentLevel = 1;
    this.levelStates = {
      1: { completed: false, bestTime: null, bestErrors: null },
      2: { completed: false, bestTime: null, bestErrors: null }
    };
  }

  getCurrentLevelConfig() {
    return this.levels[this.currentLevel];
  }

  getLevelConfig(levelId) {
    return this.levels[levelId];
  }

  setCurrentLevel(levelId) {
    if (this.levels[levelId] && this.levels[levelId].unlocked) {
      this.currentLevel = levelId;
      return true;
    }
    return false;
  }

  isLevelUnlocked(levelId) {
    return this.levels[levelId] && this.levels[levelId].unlocked;
  }

  isLevelCompleted(levelId) {
    return this.levelStates[levelId] && this.levelStates[levelId].completed;
  }

  async completeLevel(levelId, stats) {
    if (!this.levels[levelId]) return false;
    const levelState = this.levelStates[levelId];
    levelState.completed = true;
    this.levels[levelId].completed = true;
    if (levelState.bestTime === null || stats.time < levelState.bestTime) {
      levelState.bestTime = stats.time;
    }
    if (levelState.bestErrors === null || stats.errors < levelState.bestErrors) {
      levelState.bestErrors = stats.errors;
    }
    const nextLevelId = levelId + 1;
    if (this.levels[nextLevelId]) {
      this.levels[nextLevelId].unlocked = true;
    }
    if (levelId === 2 && this.unlockSystem) {
      try {
        console.log('Level 2 completed, attempting to unlock custom mode...');
        const unlockResult = await this.unlockSystem.unlockCustomMode();
        if (unlockResult) {
          console.log('Custom mode unlocked successfully!');
        } else {
          console.warn('Failed to unlock custom mode');
        }
      } catch (error) {
        console.error('Error unlocking custom mode:', error);
      }
    }
    console.log(`Level ${levelId} completed!`, {
      stats,
      bestTime: levelState.bestTime,
      bestErrors: levelState.bestErrors
    });
    return true;
  }

  getLevelState(levelId) {
    return this.levelStates[levelId];
  }

  getAllLevelStates() {
    return {
      levels: this.levels,
      states: this.levelStates,
      currentLevel: this.currentLevel
    };
  }

  resetProgress() {
    this.currentLevel = 1;
    this.levels[1].unlocked = true;
    this.levels[1].completed = false;
    this.levels[2].unlocked = false;
    this.levels[2].completed = false;
    this.levelStates = {
      1: { completed: false, bestTime: null, bestErrors: null },
      2: { completed: false, bestTime: null, bestErrors: null }
    };
  }

  getNextUncompletedLevel() {
    for (let levelId = 1; levelId <= 2; levelId++) {
      if (this.levels[levelId].unlocked && !this.levelStates[levelId].completed) {
        return levelId;
      }
    }
    return null;
  }

  areAllLevelsCompleted() {
    return this.levelStates[1].completed && this.levelStates[2].completed;
  }

  setUnlockSystem(unlockSystem) {
    this.unlockSystem = unlockSystem;
  }

  isCustomModeUnlocked() {
    if (!this.unlockSystem) {
      return false;
    }
    return this.unlockSystem.isCustomModeUnlocked();
  }

  canUnlockCustomMode() {
    if (!this.unlockSystem) {
      return false;
    }
    const gameProgress = this.getAllLevelStates();
    const unlockCheck = this.unlockSystem.checkUnlockCondition(gameProgress);
    return unlockCheck.customMode.canUnlock;
  }

  getUnlockStatus() {
    if (!this.unlockSystem) {
      return {
        customModeUnlocked: false,
        canUnlockCustomMode: false,
        unlockReason: '解锁系统未初始化'
      };
    }
    const gameProgress = this.getAllLevelStates();
    const unlockCheck = this.unlockSystem.checkUnlockCondition(gameProgress);
    return {
      customModeUnlocked: this.unlockSystem.isCustomModeUnlocked(),
      canUnlockCustomMode: unlockCheck.customMode.canUnlock,
      unlockReason: unlockCheck.customMode.reason
    };
  }
}

module.exports = LevelManager;
