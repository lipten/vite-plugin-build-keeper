const express = require('express')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

const app = express()
const PORT = process.env.PORT || 3000
const DIST_PATH = path.join(__dirname, 'dist')

// 检查 dist 目录是否存在
if (!fs.existsSync(DIST_PATH)) {
  console.error('❌ dist 目录不存在，请先运行 npm run build')
  process.exit(1)
}

// 静态文件服务
app.use(express.static(DIST_PATH))

// 处理 SPA 路由 - 所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'))
})

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 构建服务器已启动')
  console.log(`📦 服务目录: ${DIST_PATH}`)
  console.log(`🌐 访问地址: http://localhost:${PORT}`)
  console.log(`📋 版本文件: ${path.join(__dirname, '.build-versions.json')}`)
  
  // 检查版本文件是否存在
  const versionsFile = path.join(__dirname, '.build-versions.json')
  if (fs.existsSync(versionsFile)) {
    try {
      const versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'))
      console.log(`📊 当前版本数量: ${versions.length}`)
      if (versions.length > 0) {
        const latestVersion = versions[versions.length - 1]
        console.log(`🆕 最新版本: ${latestVersion.id}`)
        console.log(`📁 文件数量: ${latestVersion.files.length}`)
      }
    } catch (error) {
      console.log('⚠️ 无法读取版本文件')
    }
  } else {
    console.log('⚠️ 版本文件不存在')
  }
  
  console.log('\n💡 提示:')
  console.log('   - 修改代码后重新运行 npm run build')
  console.log('   - 刷新浏览器查看最新构建')
  console.log('   - 检查 .build-versions.json 文件了解版本管理')
  
  // 自动打开浏览器
  const url = `http://localhost:${PORT}`
  console.log(`\n🌐 正在打开浏览器: ${url}`)
  
  // 根据操作系统选择打开命令
  const platform = process.platform
  let command
  
  if (platform === 'win32') {
    command = `start ${url}`
  } else if (platform === 'darwin') {
    command = `open ${url}`
  } else {
    command = `xdg-open ${url}`
  }
  
  exec(command, (error) => {
    if (error) {
      console.log('⚠️ 无法自动打开浏览器，请手动访问:', url)
    } else {
      console.log('✅ 浏览器已打开')
    }
  })
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 服务器正在关闭...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n👋 服务器正在关闭...')
  process.exit(0)
})
