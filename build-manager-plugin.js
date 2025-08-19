const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const BuildManager = require('./build-manager')

/**
 * 获取文件哈希值
 */
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Vite插件：构建版本管理
 * 在构建过程中记录生成的文件，并在构建完成后管理版本
 */
function buildManagerPlugin() {
  const manager = new BuildManager()
  let isBuildComplete = false
  const generatedFiles = new Set()

  return {
    name: 'build-manager',
    apply: 'build',

    // 构建开始
    buildStart() {
      console.log('🔧 构建版本管理插件已启用')
      isBuildComplete = false
      generatedFiles.clear()
    },

    // 记录生成的文件
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        if (fileName.startsWith('assets/')) {
          generatedFiles.add(fileName)
        }
      }
    },

    // 构建完成
    async closeBundle() {
      if (isBuildComplete) return
      isBuildComplete = true

      console.log('\n📦 构建完成，开始版本管理...')
      console.log(`   生成文件数量: ${generatedFiles.size}`)

      try {
        // 收集文件信息
        const files = []
        const distPath = path.join(__dirname, '../dist')

        for (const fileName of generatedFiles) {
          const filePath = path.join(distPath, fileName)
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            files.push({
              path: fileName,
              hash: getFileHash(filePath),
              size: stat.size,
              mtime: stat.mtime.getTime(),
            })
          }
        }

        // 更新版本记录
        const result = await manager.manageBuild(files)
        console.log(`✅ 版本管理完成: ${result.versionId}`)
      } catch (error) {
        console.error('❌ 版本管理失败:', error.message)
      }
    },
  }
}

module.exports = buildManagerPlugin
