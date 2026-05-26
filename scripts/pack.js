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
  } catch {}
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
  } catch {}
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
      console.log(`  ✅ macOS: ${name}_mac.zip (${sizeMB} MB) — 解压后双击 .app 安装`)
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
      name: '安装说明.txt',
      mode: 0o644,
    })

    archive.directory(distDir, `${appName}/Contents/Resources/dist`)

    archive.finalize()
  })
}

function copyLinuxScripts() {
  const scripts = ['install_linux.sh', 'uninstall_linux.sh']
  for (const s of scripts) {
    const src = path.join(scriptsDir, s)
    const dest = path.join(buildDir, s)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
    }
  }
  console.log('  ✅ Linux: 安装/卸载脚本')
}

function copyDistToBuild() {
  const targetDir = path.join(buildDir, `${name}_${version}`)
  fs.mkdirSync(targetDir, { recursive: true })
  const files = fs.readdirSync(distDir)
  for (const f of files) {
    fs.cpSync(path.join(distDir, f), path.join(targetDir, f), { recursive: true })
  }
  console.log('  ✅ 通用: 散装文件目录（可用于手动安装）')
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
  buildNsis()
  await buildMacInstaller()
  copyLinuxScripts()
  copyDistToBuild()

  console.log('\n5️⃣  清理中间文件...')
  const tmpPublish = path.join(scriptsDir, 'publish.xml')
  if (fs.existsSync(tmpPublish)) fs.unlinkSync(tmpPublish)

  const files = fs.readdirSync(buildDir)
  console.log(`\n📦 构建产物 (${buildDir}):`)
  for (const f of files) {
    const stat = fs.statSync(path.join(buildDir, f))
    const size = stat.isDirectory() ? '' : ` (${(stat.size / 1024).toFixed(0)} KB)`
    console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${f}${size}`)
  }

  console.log(`\n🎉 打包完成！
  Windows:  双击 ${name}_setup.exe 安装
  macOS:    解压 ${name}_mac.zip → 右键打开 .app 安装
  Linux:    运行 bash install_linux.sh
`)
}

main().catch(e => {
  console.error('❌ 打包失败:', e.message)
  process.exit(1)
})
