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
  // 颜色（WPS 使用 BGR 格式，不是 RGB）
  COLORS: {
    BLACK: 0x000000,
    RED: 0x0000ff, // BGR 格式：蓝=0, 绿=0, 红=255
    BLUE: 0xff0000, // BGR 格式：蓝=255, 绿=0, 红=0
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
  // 页眉 logo 配置
  LOGO: {
    FILE_NAME: 'logo_card.png',
    WIDTH: 50, // logo 宽度（磅值）
    LEFT: 490, // 距页面左边距离
    TOP: 20 // 距页面顶部距离
  },
  // 封面配置
  COVER: {
    TOP_BLANK_LINES: 3, // 顶部空行数
    LOGO_WIDTH: 200, // 封面 logo 宽度（磅值）
    LOGO_BOTTOM_LINES: 1, // logo 下方空行数
    TITLE_FONT_SIZE: 42, // 标题字号（初号）
    TITLE_BOTTOM_LINES: 0, // 标题下方空行数
    DIVIDER_FONT_SIZE: 12, // 装饰线字号
    DIVIDER_BOTTOM_LINES: 3, // 装饰线下方空行数
    INFO_FONT_SIZE: 14, // 文档信息字号
    INFO_LINE_SPACING: 1, // 文档信息每项间隔空行数
    INFO_BOTTOM_LINES: 2, // 文档信息下方空行数
    BRAND_FONT_SIZE: 16 // 底部机构名称字号
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
