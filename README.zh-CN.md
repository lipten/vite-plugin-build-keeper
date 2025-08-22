# vite-plugin-build-keeper

[English](README.md) | [中文](README.zh-CN.md)

一个用于管理构建版本并保留多个构建产物的 Vite 插件，实现无缝部署。

## 功能特性

- 🚀 **版本管理**: 自动跟踪构建版本并管理文件历史
- 📦 **智能清理**: 删除未使用的文件，同时保留最近构建的资源
- 🔄 **无缝部署**: 通过保留多个构建版本来防止页面导航时的 404 错误
- ⚙️ **可配置**: 自定义版本限制、文件模式和输出目录
- 📊 **详细日志**: 全面的构建信息和清理统计

## 安装

```bash
npm install vite-plugin-build-keeper
# 或
yarn add vite-plugin-build-keeper
# 或
pnpm add vite-plugin-build-keeper
```

## 使用方法

### 基本用法

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper()
  ],
  build: {
    emptyOutDir: false, // 重要：保留现有文件
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
```

### 高级配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper({
      // 构建管理器选项
      maxVersions: 5,                    // 保留5个版本（默认：3）
      distPath: './dist',                // 自定义dist目录
      versionsFile: './dist/.build-versions.json', // 自定义版本文件（默认在 dist 目录中）
      assetsPattern: 'assets/',          // 自定义资源模式
      
      // 插件选项
      enabled: true,                     // 启用/禁用插件
      verbose: false                      // 显示详细日志
    })
  ],
  build: {
    emptyOutDir: false, // 重要：保留现有文件
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
```

### 配置示例

#### 自定义构建目录和版本文件
```javascript
buildKeeper({
  distPath: './build',                   // 使用 'build' 而不是 'dist'
  versionsFile: './.my-versions.json',   // 自定义版本文件名（默认在 dist 目录中）
  maxVersions: 10                        // 保留10个版本
})
```

#### 最小配置
```javascript
buildKeeper({
  maxVersions: 2,                        // 只保留2个版本
  verbose: false                         // 禁用详细日志
})
```

#### 自定义资源模式
```javascript
buildKeeper({
  assetsPattern: 'static/',              // 跟踪 'static/' 目录下的文件
  maxVersions: 5
})
```

## 重要配置

### 必需的构建设置

**⚠️ 重要**: 你必须在 Vite 构建配置中设置 `emptyOutDir: false`。这是插件正常工作的必要条件：

```javascript
export default defineConfig({
  plugins: [buildKeeper()],
  build: {
    emptyOutDir: false  // 版本管理必需
  }
})
```

**为什么需要这个设置？**
- 插件需要保留之前的构建文件来管理多个版本
- 如果 `emptyOutDir` 为 `true`（默认值），Vite 会在每次构建前清空输出目录
- 这会与插件的版本管理功能产生冲突

### 文件哈希优化

**💡 推荐**: 在构建配置中启用文件哈希以避免无更改的文件产生新的构建产物：

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

**文件哈希的优势：**
- **减少文件生成**: 未更改的文件不会在每次构建时产生新的文件名
- **更好的缓存**: 内容相同的文件将具有相同的哈希值
- **智能清理**: 插件会保留版本信息中引用的文件，即使它们来自较旧的构建
- **存储效率**: 防止具有不同名称但内容相同的重复文件累积

## 工作原理

1. **构建开始**: 插件检测构建过程并初始化版本跟踪
2. **文件收集**: 在构建过程中收集生成的资源信息
3. **版本创建**: 创建包含文件元数据的新版本记录
4. **智能清理**: 删除不被任何最近版本引用的文件
5. **版本管理**: 维护可配置数量的最近版本

## 配置选项

### BuildKeeperOptions

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 启用或禁用插件 |
| `verbose` | `boolean` | `true` | 显示详细控制台输出 |
| `maxVersions` | `number` | `3` | 保留的最大版本数量 |
| `distPath` | `string` | `./dist` | 构建输出目录路径 |
| `versionsFile` | `string` | `{distPath}/.build-versions.json` | 版本跟踪文件路径 |
| `assetsPattern` | `string` | `assets/` | 匹配资源文件的模式 |

## 版本文件格式

插件在 dist 目录中创建一个 `.build-versions.json` 文件来跟踪构建版本：

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

## 使用场景

### 防止导航时的 404 错误

这个插件特别适用于单页应用程序（SPA），用户在不刷新页面的情况下在页面间导航。通过保留多个构建版本，插件确保在部署转换期间，之前构建的资源仍然可用。

### 示例场景

1. 用户正在使用应用版本 A
2. 你部署了版本 B
3. 用户在不刷新的情况下导航到新页面
4. 浏览器请求版本 A 的资源（仍然存在）
5. 不会发生 404 错误

## API 参考

### buildKeeper(options?: BuildKeeperOptions): Plugin

创建用于构建版本管理的 Vite 插件实例。

### BuildManager

你也可以直接使用 BuildManager 类来获得更多控制：

```javascript
import { BuildManager } from 'vite-plugin-build-keeper'

const manager = new BuildManager({
  maxVersions: 5,
  distPath: './dist'
})

// 手动管理构建
await manager.manageBuild(files)

// 显示版本信息
manager.showVersions()

// 清理所有版本
manager.cleanAllVersions()
```

## 开发

### 构建插件

```bash
npm run build
```

### 运行测试

```bash
npm test
```

### 开发模式

```bash
npm run dev
```

## 许可证

MIT

## 贡献

欢迎贡献！请随时提交 Pull Request。
