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
 * 获取文件哈希值
 */
function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Vite插件：构建版本管理
 * 在构建过程中记录生成的文件，并在构建完成后管理版本
 */
export function buildKeeper(options: BuildKeeperOptions = {}): Plugin {
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
        if (verbose) {
          console.log(`[📦 plugin-build-keeper]> ✅ Version management completed: ${result.versionId}`)
        }
      } catch (error) {
        console.error('[📦 plugin-build-keeper]> ❌ Version management failed:', (error as Error).message)
      }
    },
  }
}

export default buildKeeper
