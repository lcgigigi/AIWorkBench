# AIworkbench 项目文件说明

本文档按当前仓库结构（不含 `.git`、`node_modules`、`dist`）整理，每个文件都给出用途说明，便于后续维护和交接。

## 1) 根目录文件

| 文件 | 作用 |
| --- | --- |
| `.gitignore` | Git 忽略规则，排除日志、构建产物、IDE 配置等。 |
| `.nvmrc` | Node 版本声明（当前为 `22.21.1`）。 |
| `README.md` | 默认 Vue + Vite 模板说明，当前与项目实际业务不完全一致。 |
| `index.html` | Vite 入口 HTML，挂载点 `#app`，加载 `src/main.ts`。 |
| `package.json` | 项目依赖和脚本定义（`dev/build/preview`）。 |
| `package-lock.json` | npm 锁定文件，确保依赖安装版本一致。 |
| `tsconfig.json` | TypeScript 工程入口，引用 app/node 两套 tsconfig。 |
| `tsconfig.app.json` | 前端应用 TS 配置（严格模式、Vue 文件包含范围）。 |
| `tsconfig.node.json` | Node 侧 TS 配置（主要用于 `vite.config.ts`）。 |
| `vite.config.ts` | Vite 构建配置，启用 Vue 插件。 |
| `PROJECT_FILE_GUIDE.md` | 本文档：项目逐文件说明。 |

## 2) public

| 文件 | 作用 |
| --- | --- |
| `public/vite.svg` | 默认 Vite 图标资源（`index.html` 的 favicon 使用）。 |

## 3) src 入口与全局样式

| 文件 | 作用 |
| --- | --- |
| `src/main.ts` | 应用启动入口：创建 Vue App、注册 Pinia/Router、安装 mocks、挂载应用。 |
| `src/App.vue` | 根组件：挂载背景层、路由容器和全局 Toast。 |
| `src/style.css` | 全局样式入口：引入设计 token、基础排版和页面背景。 |
| `src/styles/tokens.css` | 全局设计变量（颜色、圆角、间距、阴影、状态色、字体等）。 |
| `src/assets/vue.svg` | 默认 Vue 图标资源，当前业务代码基本未使用。 |

## 4) API 层

| 文件 | 作用 |
| --- | --- |
| `src/api/types.ts` | API 与领域类型定义（草稿、任务、聊天、资讯、建议等）。 |
| `src/api/client.ts` | 通用 `fetch` 封装与 `ApiError` 错误标准化。 |
| `src/api/index.ts` | 具体接口方法集合（chat、submit、recentTasks、news、suggestions 等）。 |

## 5) 应用壳与导航

| 文件 | 作用 |
| --- | --- |
| `src/app/WorkbenchShell.vue` | 主工作台壳：顶部栏、侧边栏、主内容区、任务面板挂载。 |
| `src/app/LeftSidebar.vue` | 左侧导航与布局编辑入口，含任务数徽标和路由跳转。 |

## 6) 基础组件

| 文件 | 作用 |
| --- | --- |
| `src/components/ambient/BorderBackground.vue` | 全屏氛围背景画布动画层（动态渐变 + 点线效果）。 |
| `src/components/base/BaseButton.vue` | 统一按钮组件（variant/size/disabled）。 |
| `src/components/base/BaseCard.vue` | 统一卡片容器组件。 |
| `src/components/base/BaseDrawer.vue` | 抽屉组件（遮罩、侧滑、可关闭）。 |
| `src/components/base/BaseFormField.vue` | 表单项壳组件（label/必填/错误态）。 |
| `src/components/base/BaseInput.vue` | 统一输入框组件（v-model）。 |
| `src/components/base/BaseTextarea.vue` | 统一多行输入组件（v-model）。 |
| `src/components/base/BaseToast.vue` | 全局 Toast 展示组件。 |
| `src/components/HelloWorld.vue` | Vue 默认示例组件，当前业务未使用。 |

## 7) 页面与页面逻辑

| 文件 | 作用 |
| --- | --- |
| `src/pages/DashboardPage.vue` | 首页容器，渲染 WidgetGrid。 |
| `src/pages/AllFunctionsPage.vue` | “所有功能”页面，展示 OA 流程入口卡片。 |
| `src/pages/ComingSoonPage.vue` | “敬请期待”页面，展示 roadmap 占位模块。 |
| `src/pages/RecentTaskDetailsPage.vue` | 任务详情页视图壳，组合 composable 与样式。 |
| `src/pages/recent-task-details/useRecentTaskDetailsPage.ts` | 任务详情页核心状态与交互逻辑（任务/流程联动、对话、事实清单编辑、打字机效果、执行流程）。 |
| `src/pages/recent-task-details/RecentTaskDetailsPage.css` | 任务详情页样式。 |

## 8) 任务面板（Panel）

| 文件 | 作用 |
| --- | --- |
| `src/panels/TaskPanel/TaskPanel.vue` | 侧边任务面板 UI（草稿编辑、确认、提交、状态展示）。 |
| `src/panels/TaskPanel/useTaskPanelStore.ts` | 任务面板状态机与提交流程（校验、提交、轮询、打开任务）。 |

## 9) 路由

| 文件 | 作用 |
| --- | --- |
| `src/router/index.ts` | 路由表定义：工作台壳 + 首页/功能页/任务详情页/敬请期待页。 |

## 10) Mock 与场景引擎

| 文件 | 作用 |
| --- | --- |
| `src/mocks/install.ts` | 开发环境拦截 `/api/*` 请求并接入本地 mock 实现。 |
| `src/mocks/mockApi.ts` | Mock API 主体：聊天解析、任务提交、状态轮询、资讯与建议数据。 |
| `src/scenarios/types.ts` | 场景协议定义（字段、校验、摘要构建接口）。 |
| `src/scenarios/index.ts` | 场景注册中心与按 id 获取场景的方法。 |
| `src/scenarios/leave/leaveScenario.ts` | 请假场景实现：字段定义、校验规则、任务摘要生成。 |

## 11) 服务与状态管理（Stores）

| 文件 | 作用 |
| --- | --- |
| `src/services/taskLifecycle.ts` | 通用任务生命周期工具（提交草稿、轮询任务状态）。 |
| `src/stores/useWorkbenchStore.ts` | 工作台 UI 状态（任务面板、布局编辑、widget 显隐等，含本地持久化）。 |
| `src/stores/useTasksStore.ts` | 最近任务数据源（拉取、合并、状态更新、选中任务）。 |
| `src/stores/useExecutionFlowsStore.ts` | AI 执行流主状态（发起、继续对话、执行、轮询、与任务联通）。 |
| `src/stores/useToastStore.ts` | Toast 队列管理。 |
| `src/stores/useChatStore.ts` | 早期聊天状态实现（与 TaskPanel 对接），当前部分能力被 ExecutionFlow 体系替代。 |

## 12) 工具函数

| 文件 | 作用 |
| --- | --- |
| `src/utils/id.ts` | 生成带前缀的唯一 id。 |
| `src/utils/taskStatus.ts` | 任务状态到中文文案的映射。 |

## 13) 小组件（Widgets）系统

| 文件 | 作用 |
| --- | --- |
| `src/widgets/types.ts` | widget 类型定义（id、布局、状态、定义结构）。 |
| `src/widgets/registry.ts` | widget 注册表与默认布局状态。 |
| `src/widgets/headerActions.ts` | widget 头部刷新动作注册/读取中心。 |
| `src/widgets/WidgetFrame.vue` | 通用 widget 卡片框架（标题、刷新、折叠/关闭控制）。 |
| `src/widgets/WidgetGrid.vue` | 首页 widget 网格布局与恢复默认逻辑。 |
| `src/widgets/InputWidget/InputWidget.vue` | 智能任务入口组件（输入、快捷发起、发送并跳转任务详情）。 |
| `src/widgets/HotNewsWidget/HotNewsWidget.vue` | 资讯速览组件（拉取并展示热点资讯）。 |
| `src/widgets/CommonActionsWidget/CommonActionsWidget.vue` | AI 快捷建议组件（建议列表 + 一键发起流程）。 |
| `src/widgets/RecentTasksWidget/RecentTasksWidget.vue` | 最近任务组件（展示任务状态并可打开任务面板）。 |
| `src/widgets/ComingSoonWidget/ComingSoonWidget.vue` | 能力孵化区占位组件。 |

---

## 备注

1. 当前代码里存在一些“模板遗留/历史路径”文件（如 `README.md` 默认内容、`HelloWorld.vue`、`src/assets/vue.svg`）。
2. `InputWidget.vue` 中可看到冲突标记痕迹（`<<<<<<<`, `=======`, `>>>>>>>`），建议后续清理，避免构建或样式异常。
