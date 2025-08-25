# vite-plugin-build-keeper

[English](README.md) | [中文](README.zh-CN.md)

一个用于管理构建版本并保留多个构建产物的 Vite 插件，实现无缝部署。

## 功能特性

- 🚀 **版本管理**: 自动跟踪构建版本并管理文件历史
- 📦 **智能清理**: 删除未使用的文件，同时保留最近构建的资源
- 🔄 **无缝部署**: 通过保留多个构建版本来防止页面导航时的 404 错误
- 🛡️ **构建保护**: 通过自动备份和恢复机制保护最新构建文件
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
    emptyOutDir: false // 重要：保留现有文件
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
    emptyOutDir: false // 重要：保留现有文件
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

## 工作原理

插件实现了四步构建保护工作流程：

1. **构建开始**: 插件检测构建过程并初始化版本跟踪
2. **文件收集**: 在构建过程中收集生成的资源信息
3. **备份阶段**: 在 `.last_build_assets` 文件夹中创建最新构建文件的临时备份
4. **版本管理**: 创建新版本记录并删除不被最近版本引用的文件
5. **恢复阶段**: 从备份恢复最新构建文件，确保它们不会被意外删除
6. **清理阶段**: 删除临时备份文件夹，保持目录整洁

### 构建保护机制

插件使用复杂的备份和恢复系统来防止最新构建文件被意外删除：

- **临时备份**: 最新构建文件备份到 `.last_build_assets`（隐藏文件夹）
- **安全清理**: 版本管理可以安全地删除旧文件而不影响最新构建
- **自动恢复**: 清理后自动恢复最新构建文件
- **清洁状态**: 恢复后删除备份文件夹，维护清洁的目录结构

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

1. 用户正在使用版本 A 的应用
2. 您部署了版本 B
3. 用户在不刷新的情况下导航到新页面
4. 浏览器请求版本 A 的资源（仍然存在）
5. 不会出现 404 错误

### 构建安全性

备份和恢复机制确保：
- 最新构建文件在版本清理过程中永远不会被意外删除
- 构建过程更加可靠和可预测
- 无需手动干预即可从清理错误中恢复

## API 参考

### buildKeeper(options?: BuildKeeperOptions): Plugin

创建用于构建版本管理的 Vite 插件实例。

### BuildManager

您也可以直接使用 BuildManager 类来获得更多控制：

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
