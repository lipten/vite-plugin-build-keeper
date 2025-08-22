import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    react(),
    buildKeeper({
      maxVersions: 2,
      distPath: './dist',
      versionsFile: './dist/.build-versions.json',
      assetsPattern: 'assets/',
      enabled: true,
      verbose: true
    })
  ],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // 启用文件哈希，避免未更改的文件产生新文件名
        // 插件会保留被版本信息引用的资源文件
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
