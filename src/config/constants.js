/**
 * 项目常量配置
 */

// 品牌信息
export const BRAND = {
  NAME: '陈恒律师AI助理',
  HEADER_TEXT: '本报告由 陈恒律师AI助理 生成，仅供参考，不构成法律意见。'
}

// 开发环境配置
export const DEV_CONFIG = {
  // 开发环境下的项目根目录（wpsjs debug 时使用）
  PROJECT_ROOT: 'C:\\Users\\11071\\Documents\\2025workplace\\「WPS插件」\\250723LawAI',
  // 打包输出目录
  BUILD_DIR: 'wps-addon-build'
}

// 报告样式常量
export const REPORT_STYLE = {
  // 颜色（黑、红、蓝三色）
  COLORS: {
    BLACK: 0x000000,
    RED: 0xff0000,
    BLUE: 0x0000ff,
    WHITE: 0xffffff,
    LIGHT_GRAY: 0xf2f2f2
  },
  // 字号（磅值）
  FONT_SIZE: {
    CHU_HAO: 42, // 初号
    ER_HAO: 22, // 二号
    SI_HAO: 14, // 四号
    XIAO_SI: 12 // 小四
  },
  // 页面边距（磅值）
  PAGE_MARGIN: 72,
  // logo 配置
  LOGO: {
    FILE_NAME: 'logo_card.png',
    WIDTH: 50, // logo 宽度（磅值），高度会按比例自动计算
    LEFT: 490, // 距页面左边距离
    TOP: 20 // 距页面顶部距离
  }
}

// 中文数字
export const CHINESE_NUMBERS = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五'
]
