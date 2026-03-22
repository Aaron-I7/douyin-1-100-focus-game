/**
 * SidebarRewardSystem - 侧边栏复访奖励系统
 * 
 * 抖音小游戏必接能力：引导用户从首页侧边栏进入游戏领取奖励
 * 
 * 功能：
 * - 监听启动场景，判断是否从侧边栏启动
 * - 显示奖励入口（礼包图标）
 * - 引导用户跳转到侧边栏
 * - 检测用户从侧边栏返回并发放奖励
 * 
 * 参考文档：
 * https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/open-ability/Introduction-for-tech
 */

class SidebarRewardSystem {
  constructor() {
    // 启动信息
    this.launchInfo = null;
    this.latestLaunchInfo = null;
    
    // 侧边栏支持状态
    this.sidebarSupported = false;
    this.checkingSidebarSupport = false;
    
    // 奖励状态
    this.rewardClaimed = false;
    this.lastClaimDate = null;
    
    // 回调函数
    this.onRewardClaimable = null;
    this.onRewardClaimed = null;
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化系统
   */
  init() {
    console.log('[SidebarReward] 初始化侧边栏奖励系统');
    
    // 检查是否在抖音环境
    if (typeof tt === 'undefined') {
      console.warn('[SidebarReward] 非抖音环境，侧边栏功能不可用');
      return;
    }
    
    // 立即监听 tt.onShow（必须在 game.js 运行时机同步监听）
    this.setupLaunchListener();
    
    // 检查侧边栏支持
    this.checkSidebarSupport();
    
    // 加载奖励状态
    this.loadRewardState();
  }
  
  /**
   * 设置启动监听器
   * 注意：必须在游戏启动时机（game.js 运行时机）同步监听
   */
  setupLaunchListener() {
    if (typeof tt === 'undefined' || !tt.onShow) {
      console.warn('[SidebarReward] tt.onShow 不可用');
      return;
    }
    
    // 监听小游戏启动和切前台
    tt.onShow((options) => {
      console.log('[SidebarReward] onShow 触发:', options);
      
      // 保存最新的启动信息
      this.latestLaunchInfo = options;
      
      // 如果是首次启动，也保存到 launchInfo
      if (!this.launchInfo) {
        this.launchInfo = options;
      }
      
      // 检查是否从侧边栏启动
      this.checkSidebarLaunch(options);
    });
    
    console.log('[SidebarReward] 启动监听器已设置');
  }
  
  /**
   * 检查侧边栏支持
   */
  async checkSidebarSupport() {
    if (typeof tt === 'undefined' || !tt.checkScene) {
      console.warn('[SidebarReward] tt.checkScene 不可用');
      this.sidebarSupported = false;
      return;
    }
    
    this.checkingSidebarSupport = true;
    
    try {
      const result = await new Promise((resolve, reject) => {
        tt.checkScene({
          scene: 'sidebar',
          success: (res) => {
            console.log('[SidebarReward] checkScene 成功:', res);
            resolve(res);
          },
          fail: (err) => {
            console.error('[SidebarReward] checkScene 失败:', err);
            reject(err);
          }
        });
      });
      
      // isExist=true 表示支持侧边栏
      this.sidebarSupported = result.isExist === true;
      console.log('[SidebarReward] 侧边栏支持状态:', this.sidebarSupported);
      
    } catch (error) {
      console.error('[SidebarReward] 检查侧边栏支持失败:', error);
      this.sidebarSupported = false;
    } finally {
      this.checkingSidebarSupport = false;
    }
  }
  
  /**
   * 检查是否从侧边栏启动
   * @param {Object} options - 启动参数
   */
  checkSidebarLaunch(options) {
    if (!options) return false;
    
    // 判断条件：
    // 1. scene 值为 021036
    // 2. launch_from 为 homepage
    // 3. location 为 sidebar_card
    const isSidebarLaunch = 
      options.scene === '021036' &&
      options.launch_from === 'homepage' &&
      options.location === 'sidebar_card';
    
    if (isSidebarLaunch) {
      console.log('[SidebarReward] 检测到从侧边栏启动！');
      this.handleSidebarLaunch();
    }
    
    return isSidebarLaunch;
  }
  
  /**
   * 处理从侧边栏启动
   */
  handleSidebarLaunch() {
    // 检查今天是否已领取
    if (this.hasClaimedToday()) {
      console.log('[SidebarReward] 今日已领取奖励');
      return;
    }
    
    // 触发奖励可领取回调
    if (this.onRewardClaimable) {
      this.onRewardClaimable();
    }
  }
  
  /**
   * 是否应该显示奖励入口
   * @returns {boolean}
   */
  shouldShowRewardEntry() {
    // 1. 必须支持侧边栏
    if (!this.sidebarSupported) {
      return false;
    }
    
    // 2. 今天还没领取过
    if (this.hasClaimedToday()) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检查今天是否已领取
   * @returns {boolean}
   */
  hasClaimedToday() {
    if (!this.lastClaimDate) {
      return false;
    }
    
    const today = new Date().toDateString();
    const lastClaim = new Date(this.lastClaimDate).toDateString();
    
    return today === lastClaim;
  }
  
  /**
   * 是否可以领取奖励
   * @returns {boolean}
   */
  canClaimReward() {
    // 1. 今天还没领取
    if (this.hasClaimedToday()) {
      return false;
    }
    
    // 2. 必须从侧边栏启动过（使用最新的启动信息）
    if (!this.latestLaunchInfo) {
      return false;
    }
    
    return this.checkSidebarLaunch(this.latestLaunchInfo);
  }
  
  /**
   * 跳转到侧边栏
   * @returns {Promise<boolean>}
   */
  async navigateToSidebar() {
    if (typeof tt === 'undefined' || !tt.navigateToScene) {
      console.error('[SidebarReward] tt.navigateToScene 不可用');
      return false;
    }
    
    try {
      await new Promise((resolve, reject) => {
        tt.navigateToScene({
          scene: 'sidebar',
          success: (res) => {
            console.log('[SidebarReward] 跳转侧边栏成功:', res);
            resolve(res);
          },
          fail: (err) => {
            console.error('[SidebarReward] 跳转侧边栏失败:', err);
            
            // 错误码 10101 表示平台权限拒绝，需要更新抖音版本
            if (err.errCode === 10101) {
              if (tt.showToast) {
                tt.showToast({
                  title: '请更新抖音到最新版本',
                  icon: 'none',
                  duration: 2000
                });
              }
            }
            
            reject(err);
          }
        });
      });
      
      return true;
      
    } catch (error) {
      console.error('[SidebarReward] 跳转侧边栏异常:', error);
      return false;
    }
  }
  
  /**
   * 领取奖励
   * @returns {Object} 奖励内容
   */
  claimReward() {
    if (!this.canClaimReward()) {
      console.warn('[SidebarReward] 不满足领取条件');
      return null;
    }
    
    // 生成奖励（可以根据游戏需求自定义）
    const reward = {
      type: 'sidebar_daily',
      items: [
        { type: 'hint', amount: 1, name: '提示卡' },
        { type: 'coins', amount: 100, name: '金币' }
      ],
      timestamp: Date.now()
    };
    
    // 标记已领取
    this.rewardClaimed = true;
    this.lastClaimDate = new Date().toISOString();
    
    // 保存状态
    this.saveRewardState();
    
    // 触发回调
    if (this.onRewardClaimed) {
      this.onRewardClaimed(reward);
    }
    
    console.log('[SidebarReward] 奖励已领取:', reward);
    
    return reward;
  }
  
  /**
   * 获取奖励状态
   * @returns {Object}
   */
  getRewardStatus() {
    return {
      sidebarSupported: this.sidebarSupported,
      shouldShowEntry: this.shouldShowRewardEntry(),
      canClaim: this.canClaimReward(),
      hasClaimedToday: this.hasClaimedToday(),
      lastClaimDate: this.lastClaimDate,
      isFromSidebar: this.latestLaunchInfo ? 
        this.checkSidebarLaunch(this.latestLaunchInfo) : false
    };
  }
  
  /**
   * 加载奖励状态
   */
  loadRewardState() {
    try {
      if (typeof tt === 'undefined' || !tt.getStorageSync) {
        return;
      }
      
      const data = tt.getStorageSync('sidebar_reward_state');
      if (data) {
        const state = typeof data === 'string' ? JSON.parse(data) : data;
        this.lastClaimDate = state.lastClaimDate || null;
        console.log('[SidebarReward] 加载奖励状态:', state);
      }
    } catch (error) {
      console.error('[SidebarReward] 加载奖励状态失败:', error);
    }
  }
  
  /**
   * 保存奖励状态
   */
  saveRewardState() {
    try {
      if (typeof tt === 'undefined' || !tt.setStorageSync) {
        return;
      }
      
      const state = {
        lastClaimDate: this.lastClaimDate,
        version: '1.0'
      };
      
      tt.setStorageSync('sidebar_reward_state', state);
      console.log('[SidebarReward] 保存奖励状态:', state);
      
    } catch (error) {
      console.error('[SidebarReward] 保存奖励状态失败:', error);
    }
  }
  
  /**
   * 获取引导文案
   * @returns {Object}
   */
  getGuidanceText() {
    const systemInfo = this.getSystemInfo();
    const gameName = systemInfo.gameName || '本游戏';
    
    return {
      entryTitle: '限定福利',
      entrySubtitle: '每日可领',
      dialogTitle: '抖音首页侧边栏入口奖励',
      steps: [
        '1. 点击下方「去首页侧边栏」按钮',
        `2. 在侧边栏，点击「${gameName}」`,
        '3. 返回游戏，领取奖励'
      ],
      buttonNotCompleted: '去首页侧边栏',
      buttonCompleted: '立即领奖',
      rewardItems: [
        '提示卡 x1',
        '金币 x100'
      ]
    };
  }
  
  /**
   * 获取系统信息
   * @returns {Object}
   */
  getSystemInfo() {
    try {
      if (typeof tt !== 'undefined' && tt.getSystemInfoSync) {
        return tt.getSystemInfoSync();
      }
    } catch (error) {
      console.error('[SidebarReward] 获取系统信息失败:', error);
    }
    
    return {
      gameName: '1-100'
    };
  }
  
  /**
   * 重置奖励状态（用于测试）
   */
  resetRewardState() {
    this.rewardClaimed = false;
    this.lastClaimDate = null;
    this.saveRewardState();
    console.log('[SidebarReward] 奖励状态已重置');
  }
}

// 导出单例
let sidebarRewardSystemInstance = null;

function getSidebarRewardSystem() {
  if (!sidebarRewardSystemInstance) {
    sidebarRewardSystemInstance = new SidebarRewardSystem();
  }
  return sidebarRewardSystemInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarRewardSystem;
  module.exports.SidebarRewardSystem = SidebarRewardSystem;
  module.exports.getSidebarRewardSystem = getSidebarRewardSystem;
} else if (typeof window !== 'undefined') {
  window.SidebarRewardSystem = SidebarRewardSystem;
  window.getSidebarRewardSystem = getSidebarRewardSystem;
}
