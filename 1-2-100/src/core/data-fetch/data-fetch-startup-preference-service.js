class StartupPreferenceService {
  static async load(userProfileManager) {
    let localDisabled = false;
    try {
      const localResult = tt.getStorageSync({ key: 'startup_prompt_disabled' });
      const localValue = localResult && typeof localResult === 'object' && Object.prototype.hasOwnProperty.call(localResult, 'data')
        ? localResult.data
        : localResult;
      if (typeof localValue === 'boolean') {
        localDisabled = localValue;
      }
    } catch (error) {
    }
    let profileDisabled = null;
    try {
      const profile = userProfileManager ? userProfileManager.getProfile() : null;
      if (profile && typeof profile.startupPromptDisabled === 'boolean') {
        profileDisabled = profile.startupPromptDisabled;
      }
    } catch (error) {
    }
    return profileDisabled !== null ? profileDisabled : localDisabled;
  }

  static async persist(disabled, userProfileManager, cloudStorageService) {
    const startupPromptDisabled = !!disabled;
    try {
      tt.setStorageSync({
        key: 'startup_prompt_disabled',
        data: startupPromptDisabled
      });
    } catch (error) {
    }
    try {
      const profile = userProfileManager ? userProfileManager.getProfile() : null;
      if (profile) {
        profile.startupPromptDisabled = startupPromptDisabled;
        profile.startupPromptVersion = 'v1';
      }
      if (cloudStorageService && typeof cloudStorageService.saveProgress === 'function') {
        await cloudStorageService.saveProgress({
          startupPromptDisabled,
          startupPromptVersion: 'v1'
        });
      }
    } catch (error) {
    }
    return startupPromptDisabled;
  }
}

module.exports = StartupPreferenceService;
