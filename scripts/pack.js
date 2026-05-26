import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const buildDir = path.join(root, 'wps-addon-build')
const scriptsDir = __dirname
const nsisDir = path.join(__dirname, 'nsis-bin')

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
  } catch {}
  return null
}

async function main() {
  console.log(`\n📦 打包 ${name} v${version}\n`)

  console.log('1️⃣  Vite 构建...')
  execSync('npm run build', { cwd: root, stdio: 'inherit' })

  console.log('\n2️⃣  生成 publish.xml...')
  const publishXml = `<jsplugins>
  <jsplugin name="${name}" type="${addonType}" url="${name}_${version}" version="${version}" enable="enable_dev" install="null" customDomain=""/>
</jsplugins>`
  fs.writeFileSync(path.join(scriptsDir, 'publish.xml'), publishXml)

  console.log('3️⃣  清理构建目录...')
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true })
  }
  fs.mkdirSync(buildDir, { recursive: true })

  console.log('4️⃣  NSIS 打包...')
  const makensis = findMakensis()
  if (!makensis) {
    console.error(`
❌ 未找到 makensis（NSIS 编译器）

请安装 NSIS（任选一种方式）：

  方式1 — 官网下载安装：
    https://nsis.sourceforge.io/Download

  方式2 — Scoop 安装：
    scoop bucket add extras
    scoop install nsis

  方式3 — Chocolatey 安装：
    choco install nsis

安装后重新运行 npm run pack
`)
    process.exit(1)
  }

  try {
    execSync(`"${makensis}" scripts/installer.nsi`, { cwd: root, stdio: 'inherit' })
  } catch (e) {
    console.error('❌ NSIS 编译失败')
    process.exit(1)
  }

  const exeName = `${name}_setup.exe`
  const exePath = path.join(buildDir, exeName)
  if (fs.existsSync(exePath)) {
    const sizeMB = (fs.statSync(exePath).size / 1024 / 1024).toFixed(1)
    console.log(`\n✅ 安装包已生成: wps-addon-build/${exeName} (${sizeMB} MB)`)
  } else {
    console.error('\n❌ 未找到输出文件')
    process.exit(1)
  }

  console.log('\n5️⃣  清理中间文件...')
  const publishXmlPath = path.join(scriptsDir, 'publish.xml')
  if (fs.existsSync(publishXmlPath)) fs.unlinkSync(publishXmlPath)

  console.log('\n🎉 打包完成！')
}

main().catch(e => {
  console.error('❌ 打包失败:', e.message)
  process.exit(1)
})
