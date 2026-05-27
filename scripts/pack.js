/* eslint-env node */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const archiver = require('archiver')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const buildDir = path.join(root, 'wps-addon-build')
const distDir = path.join(root, 'dist')
const scriptsDir = __dirname
const macDir = path.join(scriptsDir, 'mac')
const nsisDir = path.join(scriptsDir, 'nsis-bin')

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const name = pkg.name
const version = pkg.version
const addonType = pkg.addonType || 'wps'

const winExeName = `WPS_LawTools_Windows_v${version}_setup.exe`
const macDmgName = `WPS_LawTools_Mac_v${version}.dmg`
const macZipName = `WPS_LawTools_Mac_v${version}.zip`

function isMacOS() {
  return process.platform === 'darwin'
}

function findMakensis() {
  const candidates = [
    path.join(nsisDir, 'Bin', 'makensis.exe'),
    'C:\\Program Files (x86)\\NSIS\\Bin\\makensis.exe',
    'C:\\Program Files\\NSIS\\Bin\\makensis.exe',
    'C:\\Program Files (x86)\\NSIS\\makensis.exe',
    'C:\\Program Files\\NSIS\\makensis.exe',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  const whichCmd = process.platform === 'win32' ? 'where makensis' : 'which makensis'
  try {
    const result = execSync(whichCmd, { encoding: 'utf8' }).trim()
    if (result) return result.split('\n')[0].trim()
  } catch { /* makensis not on PATH */ }
  return null
}

function buildNsis() {
  const makensis = findMakensis()
  if (!makensis) {
    console.warn('\n⚠️  未找到 makensis，跳过 Windows 安装包')
    console.warn('   安装方式: scoop bucket add extras && scoop install nsis\n')
    return false
  }
  try {
    execSync(`"${makensis}" scripts/installer.nsi`, { cwd: root, stdio: 'inherit' })
    const defaultExe = path.join(buildDir, `${name}_setup.exe`)
    const renamedExe = path.join(buildDir, winExeName)
    if (fs.existsSync(defaultExe)) {
      fs.renameSync(defaultExe, renamedExe)
      const sizeMB = (fs.statSync(renamedExe).size / 1024 / 1024).toFixed(1)
      console.log(`  ✅ Windows: ${winExeName} (${sizeMB} MB)`)
      return true
    }
  } catch { /* NSIS compile failed */ }
  console.warn('\n⚠️  NSIS 编译失败，跳过 Windows 安装包\n')
  return false
}

function buildMacDmg() {
  const dmgPath = path.join(buildDir, macDmgName)
  const stagingDir = path.join(buildDir, '_dmg_staging')

  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true })
  }
  fs.mkdirSync(stagingDir, { recursive: true })

  const commandSrc = fs.readFileSync(path.join(macDir, 'install.command'), 'utf8')
  const commandScript = commandSrc
    .replace(/__PLUGIN_NAME__/g, name)
    .replace(/__PLUGIN_VERSION__/g, version)
    .replace(/__PLUGIN_TYPE__/g, addonType)

  const commandPath = path.join(stagingDir, '安装LawTools.command')
  fs.writeFileSync(commandPath, commandScript, 'utf8')
  fs.chmodSync(commandPath, 0o755)

  const readmeSrc = fs.readFileSync(path.join(macDir, 'README.txt'), 'utf8')
  const readme = readmeSrc
    .replace(/__PLUGIN_NAME__/g, name)
    .replace(/__PLUGIN_VERSION__/g, version)
    .replace(/__PLUGIN_TYPE__/g, addonType)
  fs.writeFileSync(path.join(stagingDir, '安装说明.txt'), readme, 'utf8')

  const distDest = path.join(stagingDir, 'dist')
  fs.cpSync(distDir, distDest, { recursive: true })

  try {
    if (fs.existsSync(dmgPath)) fs.unlinkSync(dmgPath)

    execSync(
      `hdiutil create -volname "WPS LawTools" -srcfolder "${stagingDir}" -ov -format UDZO "${dmgPath}"`,
      { stdio: 'pipe' }
    )

    fs.rmSync(stagingDir, { recursive: true })

    const sizeMB = (fs.statSync(dmgPath).size / 1024 / 1024).toFixed(1)
    console.log(`  ✅ macOS: ${macDmgName} (${sizeMB} MB)`)
    return true
  } catch (err) {
    console.warn(`\n⚠️  DMG 创建失败: ${err.message}`)
    console.warn('   回退为 zip 格式\n')
    fs.rmSync(stagingDir, { recursive: true })
    return false
  }
}

async function buildMacZip() {
  const zipPath = path.join(buildDir, macZipName)

  const commandSrc = fs.readFileSync(path.join(macDir, 'install.command'), 'utf8')
  const commandScript = commandSrc
    .replace(/__PLUGIN_NAME__/g, name)
    .replace(/__PLUGIN_VERSION__/g, version)
    .replace(/__PLUGIN_TYPE__/g, addonType)

  const readmeSrc = fs.readFileSync(path.join(macDir, 'README.txt'), 'utf8')
  const readme = readmeSrc
    .replace(/__PLUGIN_NAME__/g, name)
    .replace(/__PLUGIN_VERSION__/g, version)
    .replace(/__PLUGIN_TYPE__/g, addonType)

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      const sizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)
      console.log(`  ✅ macOS: ${macZipName} (${sizeMB} MB)`)
      resolve()
    })
    archive.on('error', reject)
    archive.pipe(output)

    archive.append(commandScript, {
      name: '安装LawTools.command',
      mode: 0o755,
    })

    archive.append(readme, {
      name: '安装说明.txt',
      mode: 0o644,
    })

    archive.directory(distDir, 'dist')

    archive.finalize()
  })
}

function generateReadme(hasNsis, isDmg) {
  const lines = []
  lines.push(`WPS LawTools v${version} 安装指南`)
  lines.push('='.repeat(40))
  lines.push('')

  if (hasNsis) {
    lines.push('【Windows 安装】')
    lines.push('')
    lines.push(`1. 双击 ${winExeName}`)
    lines.push('2. 按照安装向导点击"下一步"完成安装')
    lines.push('3. 打开 WPS Office，功能区将出现新选项卡')
    lines.push('4. 如未出现，请重启 WPS Office')
    lines.push('')
    lines.push('卸载方式：')
    lines.push('  控制面板 → 程序与功能 → 找到本程序 → 卸载')
    lines.push('  或在安装目录运行 uninstall.exe')
    lines.push('')
  }

  lines.push('【macOS 安装】')
  lines.push('')
  if (isDmg) {
    lines.push(`1. 双击 ${macDmgName} 打开`)
    lines.push('2. 在弹出的窗口中双击 "安装LawTools.command"')
    lines.push('3. 按照终端提示完成安装')
    lines.push('4. 完全退出 WPS (Cmd+Q) 后重新打开')
  } else {
    lines.push(`1. 双击 ${macZipName} 解压`)
    lines.push('2. 双击 "安装LawTools.command" 运行安装')
    lines.push('3. 安装成功后，完全退出 WPS (Cmd+Q) 并重新打开')
  }
  lines.push('')
  lines.push('常见问题：')
  lines.push('  - 提示"无法打开"：右键 → 打开；或在终端 chmod +x 后再双击')
  lines.push('  - 安装后看不到插件：请完全退出 WPS (Cmd+Q) 后重新打开')
  lines.push('')
  lines.push('【AI 服务配置（必填）】')
  lines.push('')
  lines.push('安装完成后，打开 WPS 中的插件，进入"设置"页面配置 AI 服务：')
  lines.push('')
  lines.push('本工具默认使用硅基流动（SiliconFlow）作为 AI 服务提供商，')
  lines.push('按以下步骤获取 API Key：')
  lines.push('')
  lines.push('1. 注册账号')
  lines.push('   打开 https://cloud.siliconflow.cn/i/WFoChvZf 注册硅基流动账号')
  lines.push('')
  lines.push('2. 实名认证')
  lines.push('   登录后完成实名认证（需上传身份证，一般几分钟即可通过）')
  lines.push('')
  lines.push('3. 创建 API Key')
  lines.push('   进入"API 密钥"页面 → 点击"新建密钥" → 复制生成的 Key')
  lines.push('')
  lines.push('4. 填写 Key')
  lines.push('   回到插件设置页面，将复制的 Key 粘贴到"API Key"输入框')
  lines.push('   API 地址保持默认（https://api.siliconflow.cn/v1），无需修改')
  lines.push('')
  lines.push('填写完成后点击"刷新"按钮测试模型列表是否正常加载。')
  lines.push('')
  lines.push('如遇问题，可扫描下方二维码联系陈恒律师咨询：')
  lines.push('')
  lines.push('  （请打开同目录下的 联系方式.png 查看二维码）')
  lines.push('')
  lines.push('金山文档、Coze 工作流等功能为可选配置，不需要可忽略。')
  lines.push('')
  lines.push('='.repeat(40))

  return lines.join('\n')
}

async function main() {
  console.log(`\n📦 打包 ${name} v${version}\n`)

  console.log('1️⃣  Vite 构建...')
  execSync('npm run build', { cwd: root, stdio: 'inherit' })

  if (!fs.existsSync(distDir)) {
    console.error('❌ Vite 构建输出 dist/ 不存在')
    process.exit(1)
  }

  console.log('\n2️⃣  准备构建目录...')
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true })
  }
  fs.mkdirSync(buildDir, { recursive: true })

  console.log('\n3️⃣  生成 publish.xml...')
  const publishXml = `<jsplugins>
  <jsplugin name="${name}" type="${addonType}" url="${name}_${version}" version="${version}" enable="enable_dev" install="null" customDomain=""/>
</jsplugins>`
  fs.writeFileSync(path.join(scriptsDir, 'publish.xml'), publishXml)
  fs.writeFileSync(path.join(buildDir, 'publish.xml'), publishXml)

  console.log('\n4️⃣  生成各平台安装包...')
  const hasNsis = buildNsis()

  let isDmg = false
  if (isMacOS()) {
    isDmg = buildMacDmg()
  }
  if (!isDmg) {
    await buildMacZip()
  }

  console.log('\n5️⃣  生成使用说明...')
  const readme = generateReadme(hasNsis, isDmg)
  fs.writeFileSync(path.join(buildDir, '使用说明.txt'), readme, 'utf8')

  const qrSrc = path.join(root, 'public', 'images', 'logo_card.png')
  if (fs.existsSync(qrSrc)) {
    fs.copyFileSync(qrSrc, path.join(buildDir, '联系方式.png'))
  }

  console.log('\n6️⃣  清理中间文件...')
  const tmpPublish = path.join(scriptsDir, 'publish.xml')
  if (fs.existsSync(tmpPublish)) fs.unlinkSync(tmpPublish)
  const buildPublish = path.join(buildDir, 'publish.xml')
  if (fs.existsSync(buildPublish)) fs.unlinkSync(buildPublish)

  for (const f of fs.readdirSync(buildDir)) {
    if (!f.endsWith('.exe') && !f.endsWith('.zip') && !f.endsWith('.dmg') && !f.endsWith('.txt') && !f.endsWith('.png')) {
      const p = path.join(buildDir, f)
      fs.rmSync(p, { recursive: true })
    }
  }

  console.log(`\n📦 构建产物 (${buildDir}):`)
  for (const f of fs.readdirSync(buildDir)) {
    const stat = fs.statSync(path.join(buildDir, f))
    const sizeKB = stat.size / 1024
    const size = sizeKB > 1024
      ? ` (${(sizeKB / 1024).toFixed(1)} MB)`
      : ` (${sizeKB.toFixed(0)} KB)`
    console.log(`  📄 ${f}${size}`)
  }

  const lines = ['\n🎉 打包完成！']
  if (hasNsis) lines.push(`  Windows:  双击 ${winExeName} 安装`)
  if (isDmg) {
    lines.push(`  macOS:    双击 ${macDmgName} → 双击 安装LawTools.command`)
  } else {
    lines.push(`  macOS:    双击 ${macZipName} 解压 → 双击 .command 安装`)
  }
  console.log(lines.join('\n'))
}

main().catch(e => {
  console.error('❌ 打包失败:', e.message)
  process.exit(1)
})
