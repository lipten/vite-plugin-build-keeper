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
    emptyOutDir: false
  }
})
