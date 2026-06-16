#!/usr/bin/env node

/**
 * 清理 WPS 加载项旧缓存并启动 wpsjs debug
 *
 * 流程：
 *   1. 杀掉正在运行的 WPS 进程（避免文件占用 / 旧缓存锁）
 *   2. 清理本地 dist 目录
 *   3. 清理 jsaddons 下的 publish.xml / authaddin.json / 加载项目录
 *   4. 清理 Vite 预构建缓存（node_modules/.vite）
 *   5. 调用 wpsjs debug 并透传所有额外参数
 *
 * 用法：
 *   npm run debug
 *   npm run debug -- -p 3889
 *   npm run debug -- -p 3889 -r 9229
 *   node scripts/clean-and-debug.js -p 3889
 */

import { execSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const addonName = pkg.name

function getJsAddonsDir() {
  const platform = process.platform
  const home = os.homedir()

  switch (platform) {
    case 'darwin':
      return path.join(
        home,
        'Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons'
      )
    case 'win32': {
      const appData = process.env.APPDATA || path.join(home, 'AppData/Roaming')
      return path.join(appData, 'kingsoft', 'wps', 'jsaddons')
    }
    case 'linux':
      return path.join(home, '.local/share/Kingsoft/wps/jsaddons')
    default:
      return null
  }
}

function killWps() {
  const platform = process.platform
  const cmds = {
    darwin: ['pkill -9 -f WPS || true'],
    linux: ['pkill -9 -f wps || true', 'pkill -9 -f wpsoffice || true'],
    win32: ['taskkill /IM wps.exe /F 2>nul', 'taskkill /IM WPS.EXE /F 2>nul'],
  }
  const list = cmds[platform] || []
  for (const cmd of list) {
    try {
      execSync(cmd, { stdio: 'ignore', shell: true })
    } catch {
      /* 没有进程时 pkill/taskkill 会返回非零，忽略 */
    }
  }
}

function rm(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
    return true
  }
  return false
}

function cleanCache() {
  console.log('\n🧹 清理 WPS 加载项旧缓存...\n')

  const distDir = path.join(root, 'dist')
  if (rm(distDir)) {
    console.log(`  ✅ 已删除 dist/`)
  } else {
    console.log(`  · dist/ 不存在，跳过`)
  }

  const viteCache = path.join(root, 'node_modules', '.vite')
  if (rm(viteCache)) {
    console.log(`  ✅ 已删除 node_modules/.vite/`)
  } else {
    console.log(`  · node_modules/.vite/ 不存在，跳过`)
  }

  const jsaddons = getJsAddonsDir()
  if (!jsaddons) {
    console.log(`  ⚠️  未知平台 ${process.platform}，跳过 jsaddons 清理`)
    return
  }

  if (!fs.existsSync(jsaddons)) {
    console.log(`  · jsaddons 目录不存在: ${jsaddons}`)
    return
  }

  const targets = [
    { p: path.join(jsaddons, 'publish.xml'), label: 'publish.xml' },
    { p: path.join(jsaddons, 'authaddin.json'), label: 'authaddin.json' },
    { p: path.join(jsaddons, addonName), label: `${addonName}/` },
  ]
  for (const { p, label } of targets) {
    if (rm(p)) {
      console.log(`  ✅ 已删除 ${label}`)
    }
  }
}

function startDebug(extraArgs) {
  console.log('\n🚀 启动 wpsjs debug ...\n')
  const child = spawn('wpsjs', ['debug', ...extraArgs], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 0)
  })
}

function main() {
  const extraArgs = process.argv.slice(2)
  killWps()
  cleanCache()
  startDebug(extraArgs)
}

main()
