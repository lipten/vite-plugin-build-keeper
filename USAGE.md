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
- 临时禁用插件进行调试

#### 6. verbose - 详细日志

控制是否显示详细的日志输出，默认为 `true`。

```javascript
buildKeeper({
  verbose: false  // 禁用详细日志
})
```

**使用场景：**
- 生产环境减少日志输出
- 调试时启用详细日志
- CI/CD 环境中控制日志级别

## 构建保护机制

### 工作原理

插件实现了四步构建保护工作流程，确保最新构建文件的安全性：

1. **备份阶段**: 将最新构建的文件备份到 `.last_build_assets` 隐藏文件夹
2. **版本管理**: 执行版本记录更新和旧文件清理
3. **恢复阶段**: 从备份恢复最新构建文件，确保它们不会被误删除
4. **清理阶段**: 删除临时备份文件夹，保持目录整洁

### 安全特性

- **临时备份**: 使用隐藏文件夹 `.last_build_assets` 进行临时备份
- **原子操作**: 备份和恢复过程具有原子性，确保数据一致性
- **自动清理**: 构建完成后自动清理备份文件夹
- **错误恢复**: 即使某个步骤失败，也不会影响整体构建流程

### 优势

- **防止误删除**: 最新构建文件永远不会被版本清理过程误删除
- **构建可靠性**: 提高构建过程的可靠性和可预测性
- **无需干预**: 完全自动化，无需手动干预
- **目录整洁**: 备份文件夹在构建完成后自动清理

## 配置示例

### 生产环境配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper({
      maxVersions: 5,                    // 保留5个版本
      distPath: './dist',
      assetsPattern: 'assets/',
      enabled: true,
      verbose: false                     // 生产环境减少日志
    })
  ],
  build: {
    emptyOutDir: false
  }
})
```

### 开发环境配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

export default defineConfig({
  plugins: [
    buildKeeper({
      maxVersions: 2,                    // 开发环境保留较少版本
      enabled: process.env.NODE_ENV === 'production',
      verbose: true                      // 开发环境启用详细日志
    })
  ],
  build: {
    emptyOutDir: false
  }
})
```

### 多环境配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { buildKeeper } from 'vite-plugin-build-keeper'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    buildKeeper({
      maxVersions: isProduction ? 5 : 2,
      distPath: isProduction ? './dist' : './dev-dist',
      verbose: !isProduction
    })
  ],
  build: {
    emptyOutDir: false
  }
})
```

### 自定义资源目录

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

5. **验证构建保护**
```bash
# 检查备份文件夹（构建过程中临时存在）
ls -la dist/.last_build_assets

# 验证最新构建文件完整性
ls -la dist/assets/
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

4. **备份文件夹未清理**
   - 检查文件系统权限
   - 确认构建过程是否正常完成
   - 查看详细日志输出

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

4. **手动清理备份文件夹**
```bash
# 如果备份文件夹未自动清理
rm -rf dist/.last_build_assets
```

## 最佳实践

1. **版本数量设置**
   - 生产环境：3-5 个版本
   - 开发环境：1-2 个版本
   - 根据部署频率调整

2. **文件路径配置**
   - 使用相对路径
   - 避免使用绝对路径
   - 确保路径在项目目录内

3. **日志配置**
   - 开发环境启用详细日志
   - 生产环境禁用详细日志
   - 根据 CI/CD 需求调整

4. **构建配置**
   - 始终设置 `emptyOutDir: false`
   - 根据项目需求调整 `assetsPattern`
   - 考虑多环境配置需求

5. **监控和维护**
   - 定期检查版本记录文件
   - 监控构建日志输出
   - 及时处理错误和警告

## 性能考虑

1. **备份操作开销**
   - 备份过程会增加构建时间
   - 大文件项目影响更明显
   - 建议在开发环境禁用插件

2. **磁盘空间使用**
   - 临时备份会占用额外磁盘空间
   - 构建完成后自动清理
   - 确保有足够的磁盘空间

3. **内存使用**
   - 版本记录会占用少量内存
   - 大量版本时考虑调整 `maxVersions`
   - 监控内存使用情况
