export interface BuildFile {
  path: string
  hash: string
  size: number
  mtime: number
}

export interface BuildVersion {
  id: string
  timestamp: number
  files: BuildFile[]
}

export interface BuildManagerOptions {
  distPath?: string
  versionsFile?: string
  maxVersions?: number
  assetsPattern?: string
  verbose?: boolean
}

export interface BuildResult {
  versionId: string
  fileCount: number
  totalVersions: number
} 
