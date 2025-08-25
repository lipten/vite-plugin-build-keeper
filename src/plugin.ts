import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { Plugin } from 'vite'
import { BuildManager } from './build-manager'
import { BuildManagerOptions, BuildFile } from './types'

export interface BuildKeeperOptions extends BuildManagerOptions {
  enabled?: boolean
  verbose?: boolean
}

/**
 * 验证构建选项参数
 */
function validateBuildKeeperOptions(options: BuildKeeperOptions): void {
  // 验证 enabled 参数
  if (options.enabled !== undefined && typeof options.enabled !== 'boolean') {
    throw new Error('buildKeeper: enabled option must be a boolean')
  }

  // 验证 verbose 参数
  if (options.verbose !== undefined && typeof options.verbose !== 'boolean') {
    throw new Error('buildKeeper: verbose option must be a boolean')
  }

  // 验证 maxVersions 参数
  if (options.maxVersions !== undefined) {
    if (typeof options.maxVersions !== 'number' || !Number.isInteger(options.maxVersions)) {
      throw new Error('buildKeeper: maxVersions option must be an integer')
    }
    if (options.maxVersions < 1 || options.maxVersions > 100) {
      throw new Error('buildKeeper: maxVersions option must be between 1 and 100')
    }
  }

  // 验证 distPath 参数
  if (options.distPath !== undefined) {
    if (typeof options.distPath !== 'string') {
      throw new Error('buildKeeper: distPath option must be a string')
    }
    if (options.distPath.trim() === '') {
      throw new Error('buildKeeper: distPath option cannot be empty')
    }
    
    // 检查路径安全性，防止路径遍历攻击
    const resolvedPath = path.resolve(options.distPath)
    const currentDir = process.cwd()
    if (!resolvedPath.startsWith(currentDir)) {
      throw new Error('buildKeeper: distPath option must be within the current working directory')
    }
  }

  // 验证 versionsFile 参数
  if (options.versionsFile !== undefined) {
    if (typeof options.versionsFile !== 'string') {
      throw new Error('buildKeeper: versionsFile option must be a string')
    }
    if (options.versionsFile.trim() === '') {
      throw new Error('buildKeeper: versionsFile option cannot be empty')
    }
    
    // 检查路径安全性
    const resolvedPath = path.resolve(options.versionsFile)
    const currentDir = process.cwd()
    if (!resolvedPath.startsWith(currentDir)) {
      throw new Error('buildKeeper: versionsFile option must be within the current working directory')
    }
  }

  // 验证 assetsPattern 参数
  if (options.assetsPattern !== undefined) {
    if (typeof options.assetsPattern !== 'string') {
      throw new Error('buildKeeper: assetsPattern option must be a string')
    }
    if (options.assetsPattern.trim() === '') {
      throw new Error('buildKeeper: assetsPattern option cannot be empty')
    }
    
    // 检查模式是否包含危险字符
    const dangerousChars = ['..', '\\', '//']
    if (dangerousChars.some(char => options.assetsPattern!.includes(char))) {
      throw new Error('buildKeeper: assetsPattern option contains invalid characters')
    }
  }
}

/**
 * 获取文件哈希值
 */
function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * 备份文件到 .last_build_assets 文件夹
 */
function backupFileToLastBuildAssets(sourcePath: string, fileName: string, distPath: string, verbose: boolean): void {
  try {
    const lastBuildAssetsPath = path.join(distPath, '.last_build_assets')
    
    // 确保 .last_build_assets 目录存在
    if (!fs.existsSync(lastBuildAssetsPath)) {
      fs.mkdirSync(lastBuildAssetsPath, { recursive: true })
    }
    
    // 创建目标文件的目录结构
    const targetDir = path.dirname(path.join(lastBuildAssetsPath, fileName))
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    
    // 复制文件
    const targetPath = path.join(lastBuildAssetsPath, fileName)
    fs.copyFileSync(sourcePath, targetPath)
    
    if (verbose) {
      console.log(`[📦 plugin-build-keeper]> 📋 Backed up: ${fileName}`)
    }
  } catch (error) {
    if (verbose) {
      console.warn(`[📦 plugin-build-keeper]> Failed to backup ${fileName}:`, (error as Error).message)
    }
  }
}

/**
 * 从 .last_build_assets 恢复文件到 assets 文件夹
 */
function restoreFileFromLastBuildAssets(fileName: string, distPath: string, verbose: boolean): void {
  try {
    const lastBuildAssetsPath = path.join(distPath, '.last_build_assets')
    const sourcePath = path.join(lastBuildAssetsPath, fileName)
    const targetPath = path.join(distPath, fileName)
    
    // 检查备份文件是否存在
    if (!fs.existsSync(sourcePath)) {
      if (verbose) {
        console.warn(`[📦 plugin-build-keeper]> Backup file not found: ${fileName}`)
      }
      return
    }
    
    // 确保目标目录存在
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    
    // 恢复文件
    fs.copyFileSync(sourcePath, targetPath)
    
    if (verbose) {
      console.log(`[📦 plugin-build-keeper]> 🔄 Restored: ${fileName}`)
    }
  } catch (error) {
    if (verbose) {
      console.warn(`[📦 plugin-build-keeper]> Failed to restore ${fileName}:`, (error as Error).message)
    }
  }
}

/**
 * 删除 .last_build_assets 备份文件夹
 */
function cleanupBackupFolder(distPath: string, verbose: boolean): void {
  try {
    const lastBuildAssetsPath = path.join(distPath, '.last_build_assets')
    
    if (fs.existsSync(lastBuildAssetsPath)) {
      // 递归删除文件夹及其内容
      fs.rmSync(lastBuildAssetsPath, { recursive: true, force: true })
      
      if (verbose) {
        console.log('[📦 plugin-build-keeper]> 🗑️ Backup folder cleaned up')
      }
    }
  } catch (error) {
    if (verbose) {
      console.warn('[📦 plugin-build-keeper]> Failed to cleanup backup folder:', (error as Error).message)
    }
  }
}

/**
 * Vite插件：构建版本管理
 * 在构建过程中记录生成的文件，并在构建完成后管理版本
 */
export function buildKeeper(options: BuildKeeperOptions = {}): Plugin {
  // 参数校验
  try {
    validateBuildKeeperOptions(options)
  } catch (error) {
    console.error('[📦 plugin-build-keeper]> ❌ Configuration validation failed:', (error as Error).message)
    throw error
  }

  const {
    enabled = true,
    verbose = true,
    ...managerOptions
  } = options

  if (!enabled) {
    return {
      name: 'build-keeper',
      apply: 'build',
    }
  }

  const manager = new BuildManager({ ...managerOptions, verbose })
  let isBuildComplete = false
  const generatedFiles = new Set<string>()

  return {
    name: 'build-keeper',
    apply: 'build',

    // 构建开始
    buildStart() {
      if (verbose) {
        console.log('[📦 plugin-build-keeper]> 🔧 Build version management plugin enabled')
      }
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

      if (verbose) {
        console.log('[📦 plugin-build-keeper]> Build completed, starting version management...')
        console.log(`[📦 plugin-build-keeper]> Generated files count: ${generatedFiles.size}`)
      }

      try {
        // 收集文件信息
        const files: BuildFile[] = []
        const distPath = path.join(process.cwd(), 'dist')

        // 第一步：备份最新构建的文件到 .last_build_assets
        if (verbose) {
          console.log('[📦 plugin-build-keeper]> 📋 Starting backup of latest build files...')
        }
        
        for (const fileName of generatedFiles) {
          const filePath = path.join(distPath, fileName)
          if (fs.existsSync(filePath)) {
            // 备份文件
            backupFileToLastBuildAssets(filePath, fileName, distPath, verbose)
            
            const stat = fs.statSync(filePath)
            files.push({
              path: fileName,
              hash: getFileHash(filePath),
              size: stat.size,
              mtime: stat.mtime.getTime(),
            })
          }
        }

        // 第二步：更新版本记录，这一步会删除不被版本信息引用的文件
        const result = await manager.manageBuild(files)
        if (verbose) {
          console.log(`[📦 plugin-build-keeper]> ✅ Version management completed: ${result.versionId}`)
        }

        // 第三步：从备份恢复文件，确保最新构建不被误删除
        if (verbose) {
          console.log('[📦 plugin-build-keeper]> 🔄 Restoring latest build files from backup...')
        }
        
        for (const fileName of generatedFiles) {
          restoreFileFromLastBuildAssets(fileName, distPath, verbose)
        }
        
        if (verbose) {
          console.log('[📦 plugin-build-keeper]> ✅ Latest build files restored successfully')
        }

        // 第四步：清理备份文件夹
        cleanupBackupFolder(distPath, verbose)
        
      } catch (error) {
        console.error('[📦 plugin-build-keeper]> ❌ Version management failed:', (error as Error).message)
      }
    },
  }
}

export default buildKeeper
