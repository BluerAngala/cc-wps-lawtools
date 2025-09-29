import { fileURLToPath, URL } from 'node:url'


import vue from '@vitejs/plugin-vue'
import { copyFile } from "wpsjs/vite_plugins"

// 引入 UnoCSS
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: './',
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
    server: {
      host: '0.0.0.0'
    }
  }
})
