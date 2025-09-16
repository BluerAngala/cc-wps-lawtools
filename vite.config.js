import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFile } from "wpsjs/vite_plugins"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const kdocsWebhook = env.VITE_KDOCS_WEBHOOK_URL || ''
  // 规范化：去掉末尾的 /sync_task，避免出现 /sync_task/sync_task
  const kdocsTarget = kdocsWebhook.replace(/\/sync_task\/?$/, '')
  return {
    base: './',
    plugins: [
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
    server: {
      host: '0.0.0.0',
      proxy: kdocsTarget
        ? {
            '/kdocs': {
              target: kdocsTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/kdocs/, ''),
              configure: (proxy) => {
                // 允许自定义 header 透传
                proxy.on('proxyReq', (proxyReq) => {
                  // 自定义 origin 为 https://www.kdocs.cn/
                  proxyReq.setHeader('Origin', new URL(kdocsTarget).origin)
                  // 自定义cookie 为 123
                  proxyReq.setHeader('Cookie', '123')
                })
              }
            }
          }
        : undefined
    }
  }
})
