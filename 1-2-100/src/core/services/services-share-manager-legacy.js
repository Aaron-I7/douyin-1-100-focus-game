class ShareManager {
  constructor(analyticsManager = null) {
    this.analyticsManager = analyticsManager;
  }

  async shareScore(scoreData) {
    try {
      const content = this.generateShareContent(scoreData);
      if (typeof tt === 'undefined' || !tt.shareAppMessage) {
        this.trackShare(scoreData);
        return true;
      }
      return new Promise((resolve) => {
        try {
          tt.shareAppMessage({
            title: content.title,
            imageUrl: content.imageUrl,
            success: () => {
              this.trackShare(scoreData);
              resolve(true);
            },
            fail: () => {
              resolve(false);
            }
          });
        } catch (error) {
          resolve(false);
        }
      });
    } catch (error) {
      return false;
    }
  }

  generateShareContent(scoreData) {
    const totalSeconds = Math.floor(scoreData.time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return {
      title: `我在 1-100 专注力挑战中用时 ${timeStr}，你能超越我吗？`,
      imageUrl: ''
    };
  }

  trackShare(scoreData) {
    if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
      this.analyticsManager.trackEvent('share', {
        level: scoreData.level,
        time: scoreData.time,
        errors: scoreData.errors
      });
    }
  }
}

module.exports = ShareManager;
