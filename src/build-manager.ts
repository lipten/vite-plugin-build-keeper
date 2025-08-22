import fs from 'fs'
import path from 'path'
import { BuildManagerOptions, BuildVersion, BuildFile, BuildResult } from './types'

export class BuildManager {
  private distPath: string
  private versionsFile: string
  private maxVersions: number
  private assetsPattern: string
  private verbose: boolean

  constructor(options: BuildManagerOptions = {}) {
    this.distPath = options.distPath || path.join(process.cwd(), 'dist')
    this.versionsFile = options.versionsFile || path.join(this.distPath, '.build-versions.json')
    this.maxVersions = options.maxVersions || 3
    this.assetsPattern = options.assetsPattern || 'assets/'
    this.verbose = options.verbose !== false // 默认启用详细日志
  }

  // 生成构建版本ID
  private generateVersionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`
  }

  // 读取版本记录
  private readVersions(): BuildVersion[] {
    try {
      if (fs.existsSync(this.versionsFile)) {
        const content = fs.readFileSync(this.versionsFile, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      if (this.verbose) {
        console.warn('[📦 plugin-build-keeper]> Failed to read version records:', (error as Error).message)
      }
    }
    return []
  }

  // 保存版本记录
  private saveVersions(versions: BuildVersion[]): void {
    try {
      fs.writeFileSync(this.versionsFile, JSON.stringify(versions, null, 2))
    } catch (error) {
      if (this.verbose) {
        console.error('[📦 plugin-build-keeper]> Failed to save version records:', (error as Error).message)
      }
    }
  }

  // 清理未被任何版本引用的文件
  private cleanUnusedFiles(versions: BuildVersion[]): number {
    if (versions.length === 0) {
      if (this.verbose) {
        console.log('[📦 plugin-build-keeper]> ⚠️ No version records, skipping cleanup')
      }
      return 0
    }

    if (this.verbose) {
      console.log('[📦 plugin-build-keeper]> 🧹 Starting file cleanup...')
    }

    // 收集所有版本中引用的文件
    const referencedFiles = new Set<string>()
    for (const version of versions) {
      for (const file of version.files) {
        if (file.path.startsWith(this.assetsPattern)) {
          referencedFiles.add(file.path)
        }
      }
    }

    if (this.verbose) {
      console.log(`[📦 plugin-build-keeper]> 📦 All versions reference ${referencedFiles.size} files`)
    }

    // 检查 assets 目录
    const assetsPath = path.join(this.distPath, this.assetsPattern.replace('/', ''))
    if (!fs.existsSync(assetsPath)) {
      if (this.verbose) {
        console.log('[📦 plugin-build-keeper]> ⚠️ Assets directory does not exist, skipping cleanup')
      }
      return 0
    }

    let deletedCount = 0
    let retainedCount = 0

    // 递归遍历目录
    const processDirectory = (dirPath: string): void => {
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
              if (this.verbose) {
                console.log(`[📦 plugin-build-keeper]>    - Deleted file: ${relativePath}`)
              }
              deletedCount++
            } catch (error) {
              if (this.verbose) {
                console.warn(`[📦 plugin-build-keeper]>    Failed to delete file ${relativePath}:`, (error as Error).message)
              }
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

    if (this.verbose) {
      console.log(`[📦 plugin-build-keeper]> ✅ Cleanup completed - Deleted files: ${deletedCount}`)
    }

    return deletedCount
  }

  // 递归删除空目录
  private removeEmptyDirectories(dirPath: string): void {
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
            if (this.verbose) {
              console.log(
                `[📦 plugin-build-keeper]>    - Deleted empty directory: ${path.relative(this.distPath, fullPath)}`
              )
            }
          }
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(`[📦 plugin-build-keeper]> Failed to delete empty directory ${dirPath}:`, (error as Error).message)
      }
    }
  }

  // 执行构建管理
  async manageBuild(generatedFiles: BuildFile[] = []): Promise<BuildResult> {
    if (this.verbose) {
      console.log('[📦 plugin-build-keeper]> Starting version retention plugin..')
    }

    // 确保dist目录存在
    if (!fs.existsSync(this.distPath)) {
      if (this.verbose) {
        console.log('[📦 plugin-build-keeper]> Creating dist directory')
      }
      fs.mkdirSync(this.distPath, { recursive: true })
    }

    // 读取现有版本记录
    const versions = this.readVersions()

    // 生成新版本ID
    const newVersionId = this.generateVersionId()
    if (this.verbose) {
      console.log(`[📦 plugin-build-keeper]> New version ID: ${newVersionId}`)
    }

    // 过滤只保留 assets 目录下的文件
    const assetsFiles = generatedFiles.filter((file) =>
      file.path.startsWith(this.assetsPattern)
    )
    if (this.verbose) {
      console.log(
        `[📦 plugin-build-keeper]> Assets directory files count: ${assetsFiles.length}/${generatedFiles.length}`
      )
    }

    // 创建新版本记录
    const newVersion: BuildVersion = {
      id: newVersionId,
      timestamp: Date.now(),
      files: assetsFiles,
    }

    // 添加新版本到记录中
    versions.push(newVersion)

    // 如果版本数量超过限制，删除最旧的版本记录
    while (versions.length > this.maxVersions) {
      const oldestVersion = versions.shift()!
      if (this.verbose) {
        console.log(
          `[📦 plugin-build-keeper]> Version count exceeds ${this.maxVersions}, removing oldest version record: ${oldestVersion.id}`
        )
      }
    }

    // 保存版本记录
    this.saveVersions(versions)

    // 清理无版本记录的文件并获取删除数量
    const deletedCount = this.cleanUnusedFiles(versions)

    if (this.verbose) {
      console.log(`[📦 plugin-build-keeper]> Current version count: ${versions.length}/${this.maxVersions}`)
      console.log(`[📦 plugin-build-keeper]> Version retention plugin completed: ${newVersionId}`)
    } else {
      console.log(`[📦 plugin-build-keeper]> Current version count: ${versions.length}/${this.maxVersions}, Cleaned files: ${deletedCount}`)
      console.log(`[📦 plugin-build-keeper]> Latest version: ${newVersionId}`)
    }

    return {
      versionId: newVersionId,
      fileCount: generatedFiles.length,
      totalVersions: versions.length,
    }
  }

  // 清理所有版本记录（用于重置）
  cleanAllVersions(): void {
    try {
      if (fs.existsSync(this.versionsFile)) {
        fs.unlinkSync(this.versionsFile)
        if (this.verbose) {
          console.log('[📦 plugin-build-keeper]> 🗑️  All version records deleted')
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.error('[📦 plugin-build-keeper]> Failed to delete version records:', (error as Error).message)
      }
    }
  }

  // 显示版本信息
  showVersions(): void {
    const versions = this.readVersions()
    if (this.verbose) {
      console.log('[📦 plugin-build-keeper]> 📋 Version information:')
      console.log(`[📦 plugin-build-keeper]> Total versions: ${versions.length}/${this.maxVersions}`)

      for (let i = 0; i < versions.length; i++) {
        const version = versions[i]
        const date = new Date(version.timestamp)
        const assetsFiles = version.files.filter((file) =>
          file.path.startsWith(this.assetsPattern)
        )
        console.log(
          `[📦 plugin-build-keeper]>   ${i + 1}. ${version.id} (${date.toLocaleString()}) - assets directory: ${assetsFiles.length} files`
        )
      }
    }
  }
}
