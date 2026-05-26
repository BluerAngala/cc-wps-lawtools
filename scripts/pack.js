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
  try {
    const result = execSync('where makensis', { encoding: 'utf8' }).trim()
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
    const exeName = `${name}_setup.exe`
    const exePath = path.join(buildDir, exeName)
    if (fs.existsSync(exePath)) {
      const sizeMB = (fs.statSync(exePath).size / 1024 / 1024).toFixed(1)
      console.log(`  ✅ Windows: ${exeName} (${sizeMB} MB)`)
      return true
    }
  } catch { /* NSIS compile failed */ }
  console.warn('\n⚠️  NSIS 编译失败，跳过 Windows 安装包\n')
  return false
}

async function buildMacInstaller() {
  const appName = 'Install WPS LawTools.app'
  const zipPath = path.join(buildDir, `${name}_mac.zip`)

  const infoPlistSrc = fs.readFileSync(path.join(macDir, 'Info.plist'), 'utf8')
  const infoPlist = infoPlistSrc
    .replace(/__PLUGIN_NAME__/g, name)
    .replace(/__PLUGIN_VERSION__/g, version)
    .replace(/__PLUGIN_TYPE__/g, addonType)

  const installScriptSrc = fs.readFileSync(path.join(macDir, 'install.sh'), 'utf8')
  const installScript = installScriptSrc
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
      console.log(`  ✅ macOS: ${name}_mac.zip (${sizeMB} MB)`)
      resolve()
    })
    archive.on('error', reject)
    archive.pipe(output)

    archive.append(infoPlist, {
      name: `${appName}/Contents/Info.plist`,
      mode: 0o644,
    })

    archive.append(installScript, {
      name: `${appName}/Contents/MacOS/install`,
      mode: 0o755,
    })

    archive.append(readme, {
      name: `${appName}/Contents/Resources/安装说明.txt`,
      mode: 0o644,
    })

    archive.directory(distDir, `${appName}/Contents/Resources/dist`)

    archive.finalize()
  })
}

function generateReadme(hasNsis) {
  const lines = []
  lines.push(`${pkg.name} v${version} 安装指南`)
  lines.push('='.repeat(40))
  lines.push('')

  if (hasNsis) {
    lines.push('【Windows 安装】')
    lines.push('')
    lines.push('1. 双击 wps_lawtools_setup.exe')
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
  lines.push('1. 双击 wps_lawtools_mac.zip 解压')
  lines.push('2. 找到 "Install WPS LawTools.app"')
  lines.push('3. 右键点击 .app → 选择"打开"')
  lines.push('   （首次打开必须右键，因为应用未签名）')
  lines.push('4. 在弹出的对话框中点击"安装"')
  lines.push('5. 安装成功后，重启 WPS Office')
  lines.push('')
  lines.push('常见问题：')
  lines.push('  - 提示"无法验证开发者"：右键 → 打开 → 点击"打开"按钮')
  lines.push('  - 安装后看不到插件：请完全退出 WPS 后重新打开')
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
  await buildMacInstaller()

  console.log('\n5️⃣  生成使用说明...')
  const readme = generateReadme(hasNsis)
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
    if (!f.endsWith('_setup.exe') && !f.endsWith('_mac.zip') && !f.endsWith('.txt') && !f.endsWith('.png')) {
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
  if (hasNsis) lines.push(`  Windows:  双击 ${name}_setup.exe 安装`)
  lines.push(`  macOS:    双击 ${name}_mac.zip 解压 → 右键打开 .app 安装`)
  console.log(lines.join('\n'))
}

main().catch(e => {
  console.error('❌ 打包失败:', e.message)
  process.exit(1)
})
