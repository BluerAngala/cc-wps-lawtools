import { fileURLToPath, URL } from 'node:url'


import vue from '@vitejs/plugin-vue'
import { copyFile } from "wpsjs/vite_plugins"

// 引入 UnoCSS
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

  return {
    base :'./',
    plugins: [
      UnoCSS({
        configFile: '../uno.config.js',
      }),
      copyFile({
        src: 'manifest.xml',
        dest: 'manifest.xml',
      }),
      copyFile({
        src: 'public/ribbon.xml',
        dest: 'ribbon.xml',
      }),
      vue()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    esbuild: {
      // 生产环境移除 console 和 debugger
      drop: mode === 'production' ? ['console', 'debugger'] : []
    },
    server: {
      host: '0.0.0.0',

      // 开发环境 代理金山文档API请求，解决CORS问题
      proxy: {
        // 开发环境 代理金山文档API请求，解决CORS问题
        '/api/kdocs': {
          target: 'https://env-00jxg9mus2ok.dev-hz.cloudbasefunction.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/kdocs/, '/wps-kdocs')
        }
      }
    }
  }
})
