/**
 * 字体配置文件
 * 定义游戏中使用的字体资源和配置
 */

// 字体文件配置
export const FONT_CONFIG = {
  // 游戏标题字体 - 使用现代几何字体风格
  title: {
    name: 'GameTitle',
    // 注意：实际项目中需要替换为真实的字体文件路径
    // 这里使用 Google Fonts 的 Orbitron 作为示例（科技感强的几何字体）
    url: 'https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC_X9Ht_H5V_glS.woff2',
    localPath: './assets/fonts/orbitron-bold.woff2',
    family: 'Orbitron, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    fallback: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
    weight: 'bold',
    style: 'normal',
    size: {
      small: 24,
      medium: 32,
      large: 48,
      xlarge: 64
    },
    description: '现代几何字体，适合游戏标题，具有科技感和未来感'
  },

  // 数字字体 - 使用等宽字体确保数字对齐
  number: {
    name: 'GameNumber',
    // 使用系统等宽字体，无需额外加载
    url: null,
    family: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace',
    fallback: '"Courier New", "Monaco", "Menlo", monospace',
    weight: 'normal',
    style: 'normal',
    size: {
      small: 14,
      medium: 18,
      large: 24,
      xlarge: 32
    },
    description: '等宽字体，确保数字显示整齐对齐'
  },

  // UI 文字字体 - 使用系统字体确保兼容性
  ui: {
    name: 'GameUI',
    url: null,
    family: '"PingFang SC", "Helvetica Neue", "Arial", "Microsoft YaHei", sans-serif',
    fallback: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
    weight: 'normal',
    style: 'normal',
    size: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24
    },
    description: '系统字体，确保在所有设备上的兼容性和可读性'
  }
};

// 字体加载优先级
export const FONT_LOADING_PRIORITY = [
  'ui',     // 最高优先级 - UI 文字
  'number', // 中等优先级 - 游戏数字
  'title'   // 最低优先级 - 标题装饰
];

// 字体文件大小限制（字节）
export const FONT_SIZE_LIMITS = {
  title: 200 * 1024,  // 200KB
  number: 100 * 1024, // 100KB
  ui: 150 * 1024      // 150KB
};

// 字体加载超时设置（毫秒）
export const FONT_LOADING_TIMEOUT = {
  title: 5000,   // 5秒
  number: 3000,  // 3秒
  ui: 3000       // 3秒
};

// 备选字体方案（如果主字体加载失败）
export const FALLBACK_FONTS = {
  title: [
    '"PingFang SC"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ],
  number: [
    '"SF Mono"',
    '"Monaco"',
    '"Courier New"',
    'monospace'
  ],
  ui: [
    '"PingFang SC"',
    '"Helvetica Neue"',
    '"Microsoft YaHei"',
    'Arial',
    'sans-serif'
  ]
};

/**
 * 获取字体的完整 CSS 字体族声明
 * @param {string} fontType - 字体类型
 * @param {boolean} includeCustom - 是否包含自定义字体
 * @returns {string} CSS 字体族声明
 */
export function getFontFamilyDeclaration(fontType, includeCustom = true) {
  const config = FONT_CONFIG[fontType];
  if (!config) {
    return FONT_CONFIG.ui.family;
  }

  if (includeCustom && config.url) {
    return config.family;
  }
  
  return config.fallback;
}

/**
 * 检查字体文件大小是否符合限制
 * @param {string} fontType - 字体类型
 * @param {number} fileSize - 文件大小（字节）
 * @returns {boolean} 是否符合限制
 */
export function validateFontSize(fontType, fileSize) {
  const limit = FONT_SIZE_LIMITS[fontType];
  return limit ? fileSize <= limit : true;
}

/**
 * 生成字体预加载链接标签
 * @param {string} fontType - 字体类型
 * @returns {string} HTML 链接标签
 */
export function generatePreloadLink(fontType) {
  const config = FONT_CONFIG[fontType];
  if (!config || !config.url) {
    return '';
  }

  return `<link rel="preload" href="${config.url}" as="font" type="font/woff2" crossorigin>`;
}

export default FONT_CONFIG;