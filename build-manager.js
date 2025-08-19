const fs = require('fs')
const path = require('path')

class BuildManager {
  constructor() {
    this.distPath = path.join(__dirname, '../dist')
    this.versionsFile = path.join(__dirname, '../.build-versions.json')
    this.maxVersions = 3
  }

  // 生成构建版本ID
  generateVersionId() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`
  }

  // 读取版本记录
  readVersions() {
    try {
      if (fs.existsSync(this.versionsFile)) {
        const content = fs.readFileSync(this.versionsFile, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn('读取版本记录失败:', error.message)
    }
    return []
  }

  // 保存版本记录
  saveVersions(versions) {
    try {
      fs.writeFileSync(this.versionsFile, JSON.stringify(versions, null, 2))
    } catch (error) {
      console.error('保存版本记录失败:', error.message)
    }
  }

  // 清理未被任何版本引用的文件
  cleanUnusedFiles(versions) {
    if (versions.length === 0) {
      console.log('⚠️ 没有版本记录，跳过清理')
      return
    }

    console.log('🧹 开始清理文件...')

    // 收集所有版本中引用的文件
    const referencedFiles = new Set()
    for (const version of versions) {
      for (const file of version.files) {
        if (file.path.startsWith('assets/')) {
          referencedFiles.add(file.path)
        }
      }
    }

    console.log(`📦 所有版本共引用 ${referencedFiles.size} 个文件`)

    // 检查 assets 目录
    const assetsPath = path.join(this.distPath, 'assets')
    if (!fs.existsSync(assetsPath)) {
      console.log('⚠️ assets 目录不存在，跳过清理')
      return
    }

    let deletedCount = 0
    let retainedCount = 0

    // 递归遍历目录
    const processDirectory = (dirPath) => {
      const items = fs.readdirSync(dirPath)

      for (const item of items) {
        const fullPath = path.join(dirPath, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          processDirectory(fullPath)
        } else {
          // 计算相对路径
          const relativePath = path
            .relative(this.distPath, fullPath)
            .replace(/\\/g, '/')

          if (!referencedFiles.has(relativePath)) {
            try {
              fs.unlinkSync(fullPath)
              console.log(`   - 删除文件: ${relativePath}`)
              deletedCount++
            } catch (error) {
              console.warn(`   删除文件失败 ${relativePath}:`, error.message)
            }
          } else {
            retainedCount++
          }
        }
      }
    }

    // 开始处理 assets 目录
    processDirectory(assetsPath)

    // 删除空目录
    this.removeEmptyDirectories(assetsPath)

    console.log(`✅ 清理完成:`)
    console.log(`   - 保留文件: ${retainedCount} 个`)
    console.log(`   - 删除文件: ${deletedCount} 个`)
  }

  // 递归删除空目录
  removeEmptyDirectories(dirPath) {
    try {
      const items = fs.readdirSync(dirPath)

      for (const item of items) {
        const fullPath = path.join(dirPath, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          this.removeEmptyDirectories(fullPath)

          // 检查目录是否为空
          const remainingItems = fs.readdirSync(fullPath)
          if (remainingItems.length === 0) {
            fs.rmdirSync(fullPath)
            console.log(
              `   - 删除空目录: ${path.relative(this.distPath, fullPath)}`
            )
          }
        }
      }
    } catch (error) {
      console.warn(`删除空目录失败 ${dirPath}:`, error.message)
    }
  }

  // 执行构建管理
  async manageBuild(generatedFiles = []) {
    console.log('🚀 开始构建管理...')

    // 确保dist目录存在
    if (!fs.existsSync(this.distPath)) {
      console.log('📁 创建dist目录')
      fs.mkdirSync(this.distPath, { recursive: true })
    }

    // 读取现有版本记录
    const versions = this.readVersions()

    // 生成新版本ID
    const newVersionId = this.generateVersionId()
    console.log(`📦 新版本ID: ${newVersionId}`)

    // 过滤只保留 assets 目录下的文件
    const assetsFiles = generatedFiles.filter((file) =>
      file.path.startsWith('assets/')
    )
    console.log(
      `📊 assets目录文件数量: ${assetsFiles.length}/${generatedFiles.length}`
    )

    // 创建新版本记录
    const newVersion = {
      id: newVersionId,
      timestamp: Date.now(),
      files: assetsFiles,
    }

    // 添加新版本到记录中
    versions.push(newVersion)

    // 如果版本数量超过限制，删除最旧的版本记录
    while (versions.length > this.maxVersions) {
      const oldestVersion = versions.shift()
      console.log(
        `📋 版本数量超过${this.maxVersions}个，移除最旧版本记录: ${oldestVersion.id}`
      )
    }

    // 保存版本记录
    this.saveVersions(versions)

    // 清理无版本记录的文件
    this.cleanUnusedFiles(versions)

    console.log(`✅ 构建管理完成`)
    console.log(`📊 当前版本数量: ${versions.length}/${this.maxVersions}`)
    console.log(`📁 当前文件数量: ${generatedFiles.length}`)

    return {
      versionId: newVersionId,
      fileCount: generatedFiles.length,
      totalVersions: versions.length,
    }
  }

  // 清理所有版本记录（用于重置）
  cleanAllVersions() {
    try {
      if (fs.existsSync(this.versionsFile)) {
        fs.unlinkSync(this.versionsFile)
        console.log('🗑️  已删除所有版本记录')
      }
    } catch (error) {
      console.error('删除版本记录失败:', error.message)
    }
  }

  // 显示版本信息
  showVersions() {
    const versions = this.readVersions()
    console.log('📋 版本信息:')
    console.log(`总版本数: ${versions.length}/${this.maxVersions}`)

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i]
      const date = new Date(version.timestamp)
      const assetsFiles = version.files.filter((file) =>
        file.path.startsWith('assets/')
      )
      console.log(
        `  ${i + 1}. ${version.id} (${date.toLocaleString()}) - assets目录: ${assetsFiles.length} 个文件`
      )
    }
  }
}

module.exports = BuildManager
