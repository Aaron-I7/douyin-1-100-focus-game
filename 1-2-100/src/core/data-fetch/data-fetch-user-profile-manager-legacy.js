class UserProfileManager {
  constructor(cloudStorageService) {
    this.cloudStorageService = cloudStorageService;
    this.userProfile = null;
    this.isLoaded = false;
  }

  async loadProfile() {
    try {
      console.log('Loading user profile...');
      const result = await this.cloudStorageService.loadProgress();
      if (result.success) {
        this.userProfile = result.data;
        this.isLoaded = true;
        console.log('User profile loaded successfully:', {
          source: result.source,
          currentLevel: this.userProfile.currentLevel,
          level1Completed: this.userProfile.level1Completed,
          level2Completed: this.userProfile.level2Completed,
          customModeUnlocked: this.userProfile.customModeUnlocked
        });
        return {
          success: true,
          profile: this.userProfile,
          source: result.source
        };
      } else {
        throw new Error(result.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      const openId = this.cloudStorageService.authService.getOpenId();
      this.userProfile = this.cloudStorageService.getDefaultUserData(openId);
      this.isLoaded = true;
      return {
        success: false,
        profile: this.userProfile,
        error: error.message,
        source: 'default'
      };
    }
  }

  getGameProgress() {
    if (!this.userProfile) return null;
    return {
      currentLevel: this.userProfile.currentLevel || 1,
      shouldContinueFromLevel: this.determineContinueLevel(),
      canAccessCustomMode: this.isCustomModeUnlocked(),
      completionStatus: {
        level1: this.isLevelCompleted(1),
        level2: this.isLevelCompleted(2)
      }
    };
  }

  determineContinueLevel() {
    if (!this.userProfile) return 1;
    if (!this.userProfile.level1Completed) {
      return 1;
    }
    if (this.userProfile.level1Completed && !this.userProfile.level2Completed) {
      return 2;
    }
    return null;
  }

  isLevelCompleted(levelId) {
    if (!this.userProfile) return false;
    if (levelId === 1) {
      return this.userProfile.level1Completed || false;
    } else if (levelId === 2) {
      return this.userProfile.level2Completed || false;
    }
    return false;
  }

  isCustomModeUnlocked() {
    return this.userProfile?.customModeUnlocked || false;
  }

  createDefaultProfile() {
    const openId = this.cloudStorageService.authService.getOpenId();
    return this.cloudStorageService.getDefaultUserData(openId);
  }

  isProfileLoaded() {
    return this.isLoaded && this.userProfile !== null;
  }

  getProfile() {
    return this.userProfile;
  }
}

module.exports = UserProfileManager;
