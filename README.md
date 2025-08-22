# vite-plugin-build-keeper

[English](README.md) | [中文](README.zh-CN.md)

A Vite plugin for managing build versions and keeping multiple build artifacts for seamless deployments.

## Features

- 🚀 **Version Management**: Automatically tracks build versions and manages file history
- 📦 **Smart Cleanup**: Removes unused files while preserving assets from recent builds
- 🔄 **Seamless Deployments**: Prevents 404 errors during page navigation by keeping multiple build versions
- ⚙️ **Configurable**: Customize version limits, file patterns, and output directories
- 📊 **Detailed Logging**: Comprehensive build information and cleanup statistics

## Installation

```bash
npm install vite-plugin-build-keeper
# or
yarn add vite-plugin-build-keeper
# or
pnpm add vite-plugin-build-keeper
```

## Usage

### Basic Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper()
  ],
  build: {
    emptyOutDir: false,  // Important: Keep previous build files for version management
    rollupOptions: {
      output: {
        // Enable file hashing to avoid generating new filenames for unchanged files
        // The plugin will preserve resource files referenced in version information
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
```

### Advanced Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper({
      // Build manager options
      maxVersions: 5,                    // Keep 5 versions (default: 3)
      distPath: './dist',                // Custom dist directory
      versionsFile: './dist/.build-versions.json', // Custom versions file (default: in dist directory)
      assetsPattern: 'assets/',          // Custom assets pattern
      
      // Plugin options
      enabled: true,                     // Enable/disable plugin
      verbose: false                      // Show detailed logs
    })
  ],
  build: {
    emptyOutDir: false,  // Important: Keep previous build files for version management
    rollupOptions: {
      output: {
        // Enable file hashing to avoid generating new filenames for unchanged files
        // The plugin will preserve resource files referenced in version information
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
```

### Configuration Examples

#### Custom Build Directory and Version File
```javascript
buildKeeper({
  distPath: './build',                   // Use 'build' instead of 'dist'
  versionsFile: './.my-versions.json',   // Custom version file name (default: in dist directory)
  maxVersions: 10                        // Keep 10 versions
})
```

#### Minimal Configuration
```javascript
buildKeeper({
  maxVersions: 2,                        // Only keep 2 versions
  verbose: false                         // Disable verbose logging
})
```

#### Custom Assets Pattern
```javascript
buildKeeper({
  assetsPattern: 'static/',              // Track files in 'static/' directory
  maxVersions: 5
})
```

## Important Configuration

### Required Build Setting

**⚠️ Important**: You must set `emptyOutDir: false` in your Vite build configuration. This is required for the plugin to work correctly:

```javascript
export default defineConfig({
  plugins: [buildKeeper()],
  build: {
    emptyOutDir: false  // Required for version management
  }
})
```

**Why is this needed?**
- The plugin needs to preserve previous build files to manage multiple versions
- If `emptyOutDir` is `true` (default), Vite will clear the output directory before each build
- This would conflict with the plugin's version management functionality

### File Hashing Optimization

**💡 Recommended**: Enable file hashing in your build configuration to avoid generating new build artifacts for unchanged files:

```javascript
build: {
  emptyOutDir: false,
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[name]-[hash].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]'
    }
  }
}
```

**Benefits of file hashing:**
- **Reduced file generation**: Unchanged files won't get new filenames on each build
- **Better caching**: Files with the same content will have the same hash
- **Smart cleanup**: The plugin preserves files referenced in version information, even if they're from older builds
- **Storage efficiency**: Prevents accumulation of duplicate files with different names but same content

## How It Works

1. **Build Start**: Plugin detects build process and initializes version tracking
2. **File Collection**: During build, collects information about generated assets
3. **Version Creation**: Creates a new version record with file metadata
4. **Smart Cleanup**: Removes files that are not referenced by any recent version
5. **Version Management**: Maintains a configurable number of recent versions

## Configuration Options

### BuildKeeperOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable the plugin |
| `verbose` | `boolean` | `true` | Show detailed console output |
| `maxVersions` | `number` | `3` | Maximum number of versions to keep |
| `distPath` | `string` | `./dist` | Path to the build output directory |
| `versionsFile` | `string` | `{distPath}/.build-versions.json` | Path to version tracking file |
| `assetsPattern` | `string` | `assets/` | Pattern to match asset files |

## Version File Format

The plugin creates a `.build-versions.json` file in the dist directory to track build versions:

```json
[
  {
    "id": "1703123456789-abc123",
    "timestamp": 1703123456789,
    "files": [
      {
        "path": "assets/index-abc123.js",
        "hash": "md5-hash-value",
        "size": 12345,
        "mtime": 1703123456789
      }
    ]
  }
]
```

## Use Cases

### Preventing 404 Errors During Navigation

This plugin is particularly useful for Single Page Applications (SPAs) where users navigate between pages without refreshing. By keeping multiple build versions, the plugin ensures that assets from previous builds remain available during deployment transitions.

### Example Scenario

1. User is on version A of your app
2. You deploy version B
3. User navigates to a new page without refreshing
4. The browser requests assets from version A (which still exist)
5. No 404 errors occur

## API Reference

### buildKeeper(options?: BuildKeeperOptions): Plugin

Creates a Vite plugin instance for build version management.

### BuildManager

You can also use the BuildManager class directly for more control:

```javascript
import { BuildManager } from 'vite-plugin-build-keeper'

const manager = new BuildManager({
  maxVersions: 5,
  distPath: './dist'
})

// Manage build manually
await manager.manageBuild(files)

// Show version information
manager.showVersions()

// Clean all versions
manager.cleanAllVersions()
```

## Development

### Building the Plugin

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 