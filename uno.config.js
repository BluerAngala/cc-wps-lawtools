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
  },
  theme: {
    colors: {
      // 自定义颜色
      primary: '#1976d2',
      secondary: '#424242',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    }
  },
})

