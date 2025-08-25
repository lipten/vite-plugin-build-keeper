# vite-plugin-build-keeper

[English](README.md) | [中文](README.zh-CN.md)

A Vite plugin for managing build versions and keeping multiple build artifacts for seamless deployments.

## Features

- 🚀 **Version Management**: Automatically tracks build versions and manages file history
- 📦 **Smart Cleanup**: Removes unused files while preserving assets from recent builds
- 🔄 **Seamless Deployments**: Prevents 404 errors during page navigation by keeping multiple build versions
- 🛡️ **Build Protection**: Safeguards latest build files with automatic backup and restore mechanism
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
    emptyOutDir: false // Important: preserve existing files
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
    emptyOutDir: false // Important: preserve existing files
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

## How It Works

The plugin implements a four-step build protection workflow:

1. **Build Start**: Plugin detects build process and initializes version tracking
2. **File Collection**: During build, collects information about generated assets
3. **Backup Phase**: Creates a temporary backup of latest build files in `.last_build_assets` folder
4. **Version Management**: Creates a new version record and removes files not referenced by recent versions
5. **Restore Phase**: Restores latest build files from backup to ensure they're not accidentally deleted
6. **Cleanup**: Removes the temporary backup folder to keep the directory clean

### Build Protection Mechanism

The plugin uses a sophisticated backup and restore system to prevent accidental deletion of the latest build files:

- **Temporary Backup**: Latest build files are backed up to `.last_build_assets` (hidden folder)
- **Safe Cleanup**: Version management can safely remove old files without affecting the latest build
- **Automatic Restore**: Latest build files are automatically restored after cleanup
- **Clean State**: Backup folder is removed after restoration, maintaining a clean directory structure

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

### Build Safety

The backup and restore mechanism ensures that:
- Latest build files are never accidentally deleted during version cleanup
- Build process is more reliable and predictable
- No manual intervention required to recover from cleanup errors

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