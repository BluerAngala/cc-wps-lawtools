import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'

export default defineConfig({
  // https://unocss.nodejs.cn/presets/
  presets: [
    // 使用 Attributify 预设
    presetAttributify(),
    // 使用 Icons 预设
    presetIcons({
      scale: 1.2,
    }),
    // 使用 Wind3 预设
    presetWind3(),
    // 使用 transformerDirectives 预设
    transformerDirectives(),
    // 使用 transformerVariantGroup 预设
    transformerVariantGroup(),
  ],
  shortcuts: {
    // 常用的快捷类
    'flex-center': 'flex items-center justify-center',
    'flex-col-center': 'flex flex-col items-center justify-center',
    'btn-primary': 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer',
    'btn-secondary': 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded cursor-pointer',
    'card': 'bg-white shadow-md rounded-lg p-4',
    'input-base': 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500',
    
    // 项目特定的快捷类
    'wps-card': 'bg-white shadow-sm rounded-lg p-4 border border-gray-100',
    'wps-header': 'flex justify-between items-center w-full',
    'wps-title': 'text-lg font-medium text-gray-900',
    'wps-subtitle': 'text-sm text-gray-600',
    'wps-section': 'mb-4',
    'wps-divider': 'border-gray-200 my-4',
    
    // 表单相关
    'form-item': 'mb-3',
    'form-label': 'block text-sm font-medium text-gray-700 mb-1',
    'form-input': 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
    'form-textarea': 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-vertical',
    
    // ConfigForm 特定样式
    'review-rule-item': 'relative p-4 mb-3 border border-gray-300 rounded bg-gray-50',
    'rule-title': 'text-sm text-gray-600 mb-3 font-medium',
    'config-section': 'mb-3 last:mb-0',
    'section-title': 'text-xs text-gray-600 mb-1.5 font-medium flex items-center gap-1.5',
    'add-rule-btn': 'mt-3 w-full',
    'contract-review-config': 'mt-2.5 w-full',
    
    // 按钮变体
    'btn-danger': 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded cursor-pointer',
    'btn-success': 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer',
    'btn-warning': 'bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded cursor-pointer',
    'btn-outline': 'border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded cursor-pointer',
    
    // 状态样式
    'status-success': 'text-green-600 bg-green-50 border border-green-200',
    'status-warning': 'text-orange-600 bg-orange-50 border border-orange-200',
    'status-error': 'text-red-600 bg-red-50 border border-red-200',
    'status-info': 'text-blue-600 bg-blue-50 border border-blue-200',
    
    // 布局相关
    'container-fluid': 'w-full px-4',
    'scroll-container': 'max-h-300px overflow-y-auto',
    'scrollbar-none': '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
    'keyword-item': 'relative p-3 mb-3 border border-gray-300 rounded bg-gray-50',
    'keyword-title': 'text-xs text-gray-600 mb-1.5 font-medium',
    'delete-btn': 'absolute top-2 right-2 w-6 h-6 p-0',
    
    // 标签相关
    'tags-display': 'flex flex-wrap gap-1.5 p-2 min-h-10 bg-gray-50 border border-gray-300 rounded mb-2',
    'tag-input-row': 'flex gap-2 items-center',
    'tag-item': 'm-0.5 text-xs',
    
    // 统计面板
    'stats-panel': 'mb-4 p-4 bg-gray-50 rounded',
    'stats-grid': 'grid grid-cols-2 gap-4',
    'stat-item': 'text-center',
    'stat-value': 'text-2xl font-bold text-blue-600',
    'stat-label': 'text-sm text-gray-600 mt-1',
  },
  theme: {
    colors: {
      // 自定义颜色 - 兼容原有的Element Plus主题
      primary: {
        50: '#e3f2fd',
        100: '#bbdefb',
        500: '#1976d2',
        600: '#1565c0',
        700: '#0d47a1',
      },
      secondary: '#424242',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      
      // WPS 项目特定颜色
      wps: {
        blue: '#4d7dee',
        light: '#f8f9fa',
        border: '#e4e7ed',
        text: '#303133',
        'text-light': '#606266',
        'text-lighter': '#909399',
      }
    },
    spacing: {
      '18': '4.5rem',
    },
    maxHeight: {
      '300px': '300px',
      '400px': '400px',
    }
  },
})

