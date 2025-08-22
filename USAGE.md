# vite-plugin-build-keeper 使用指南

## 快速开始

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

### 配置选项详解

#### 1. maxVersions - 最大版本数量

控制保留的构建版本数量，默认为 3。

```javascript
buildKeeper({
  maxVersions: 5  // 保留最近5个版本
})
```

**使用场景：**
- 生产环境：建议设置为 3-5 个版本
- 开发环境：可以设置为 1-2 个版本以节省空间
- 特殊需求：根据部署策略调整

#### 2. distPath - 构建输出目录

指定构建文件的输出目录，默认为 `./dist`。

```javascript
buildKeeper({
  distPath: './build'  // 使用 build 目录
})
```

**使用场景：**
- 不同项目使用不同的输出目录
- 多环境构建（如 staging、production）
- 与其他构建工具集成

#### 3. versionsFile - 版本记录文件

自定义版本记录文件的路径和名称，默认为 `{distPath}/.build-versions.json`。

```javascript
buildKeeper({
  versionsFile: './dist/.my-versions.json'  // 自定义文件名（相对于项目根目录）
})
```

**使用场景：**
- 避免与项目中的其他 `.json` 文件冲突
- 将版本记录放在特定目录（默认在 dist 目录中）
- 多项目共享版本记录

#### 4. assetsPattern - 资源文件模式

指定要跟踪的资源文件模式，默认为 `assets/`。

```javascript
buildKeeper({
  assetsPattern: 'static/'  // 跟踪 static 目录下的文件
})
```

**使用场景：**
- 项目使用不同的资源目录结构
- 只跟踪特定类型的资源文件
- 多环境资源管理

#### 5. enabled - 启用/禁用插件

控制插件是否启用，默认为 `true`。

```javascript
buildKeeper({
  enabled: process.env.NODE_ENV === 'production'  // 只在生产环境启用
})
```

**使用场景：**
- 开发环境禁用以加快构建速度
- 根据环境变量动态启用
- 条件性启用插件

#### 6. verbose - 详细日志

控制是否显示详细的构建日志，默认为 `true`。

```javascript
buildKeeper({
  verbose: false  // 禁用详细日志
})
```

**使用场景：**
- CI/CD 环境中减少日志输出
- 生产环境构建时静默模式
- 调试时启用详细日志

## 实际使用示例

### 示例 1：生产环境配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper({
      maxVersions: 5,                    // 保留5个版本
      distPath: './dist',
      versionsFile: './dist/.build-versions.json', // 默认在 dist 目录中
      assetsPattern: 'assets/',
      enabled: true,
      verbose: process.env.NODE_ENV === 'development'
    })
  ],
  build: {
    emptyOutDir: false
  }
})
```

### 示例 2：多环境配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      buildKeeper({
        maxVersions: isProduction ? 5 : 2,
        distPath: `./dist-${mode}`,
        versionsFile: `./dist/.build-versions-${mode}.json`, // 默认在 dist 目录中
        enabled: isProduction,
        verbose: mode === 'development'
      })
    ],
    build: {
      emptyOutDir: false
    }
  }
})
```

### 示例 3：自定义资源管理

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper({
      maxVersions: 3,
      assetsPattern: 'static/',          // 跟踪 static 目录
      versionsFile: './dist/.static-versions.json' // 默认在 dist 目录中
    })
  ],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        assetFileNames: 'static/[name]-[hash][extname]'  // 输出到 static 目录
      }
    }
  }
})
```

## 测试配置

### 运行测试

```bash
# 基本测试
npm test

# 配置选项测试
npm run test:config
```

### 手动测试步骤

1. **安装依赖**
```bash
npm install
```

2. **构建插件**
```bash
npm run build
```

3. **运行示例项目**
```bash
cd example
npm install
npm run build
```

4. **检查版本管理**
```bash
# 查看版本记录文件
cat dist/.build-versions.json

# 多次构建测试
npm run build
npm run build
npm run build
```

## 故障排除

### 常见问题

1. **版本记录文件不存在**
   - 确保 `emptyOutDir: false` 已设置
   - 检查 `distPath` 配置是否正确
   - 确认插件已启用

2. **资源文件未被跟踪**
   - 检查 `assetsPattern` 配置
   - 确认文件路径匹配模式
   - 验证构建输出目录结构

3. **版本数量不按预期清理**
   - 检查 `maxVersions` 配置
   - 确认版本记录文件权限
   - 查看控制台错误信息

### 调试技巧

1. **启用详细日志**
```javascript
buildKeeper({
  verbose: true
})
```

2. **检查版本信息**
```javascript
import { BuildManager } from 'vite-plugin-build-keeper'

const manager = new BuildManager()
manager.showVersions()
```

3. **清理所有版本**
```javascript
const manager = new BuildManager()
manager.cleanAllVersions()
```

## 最佳实践

1. **版本数量设置**
   - 生产环境：3-5 个版本
   - 开发环境：1-2 个版本
   - 根据部署频率调整

2. **文件路径配置**
   - 使用相对路径
   - 避免使用绝对路径
   - 考虑跨平台兼容性

3. **资源模式匹配**
   - 确保模式与实际目录结构匹配
   - 使用明确的目录名称
   - 避免过于宽泛的模式

4. **环境配置**
   - 开发环境禁用详细日志
   - 生产环境启用版本管理
   - 使用环境变量控制行为
