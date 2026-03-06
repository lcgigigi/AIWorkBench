# AIworkbench

一个前端优先的 AI + OA 员工工作台项目。  
当前阶段不依赖后端，接口统一使用本地 mock。

## 技术栈

- Vue 3 + TypeScript + Vite
- Pinia
- Vue Router
- VueUse

## Node 版本

项目使用 `.nvmrc` 指定版本：

```bash
22.21.1
```

## 安装与启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 路由说明

- `/`：新首页（独立全屏，不经过经典壳层侧边栏）
- `/`：新首页，任务中心、流程入口和敬请期待都在首页内部切换展示

## Mock 说明

- 开发环境默认启用 mock（见 `src/mocks/install.ts`）。
- 若要关闭 mock，可在启动前设置：

```bash
VITE_USE_MOCKS=false npm run dev
```

## 项目结构参考

逐文件说明文档见：

- `PROJECT_FILE_GUIDE.md`

## 当前交互特性（概要）

- 当前仅保留新首页，任务中心、流程入口、敬请期待都以内联方式在首页内切换。
- 新首页整合了任务中心入口、流程入口、敬请期待、经典布局编辑跳转。
- 智能任务入口支持一句话发起流程，并跳转到任务详情页继续对话执行。
- 最近任务、AI 建议、资讯速览均由 mock 数据驱动。
