# Rakko Workplace (Web Desktop Environment)

**Rakko Workplace** 是一个基于 React 19 和 TypeScript 构建的现代化 Web 桌面操作系统模拟环境。它旨在浏览器中提供媲美原生操作系统的流畅体验，集成了窗口管理、虚拟文件系统、多桌面支持以及基于 Google Gemini 的 AI 智能助手。

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/React-19-61DAFB.svg) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)

---

## 🌟 核心特性 (Features)

### 🖥️ 沉浸式桌面体验
- **玻璃拟态设计 (Glassmorphism)**: 全局采用半透明模糊效果，结合动态光影和阴影，视觉效果现代且优雅。
- **高级窗口管理**: 支持窗口的**拖拽移动**、**八向缩放**、**最大化/最小化**、**层级控制**以及**关闭动画**。
- **虚拟多桌面 (Virtual Desktops)**: 类似于 Windows 11/macOS 的任务视图，支持将窗口拖拽移动到不同的桌面空间，实现工作区的隔离。
- **深色/浅色模式**: 系统级的主题切换，实时适配所有应用和 UI 组件。

### 🤖 AI 智能管家 "Sebastian"
- 集成 **Google Gemini API**。
- 设定为《黑执事》中的 Sebastian Michaelis 人格，提供优雅、能干且略带幽默的对话服务。
- 支持流式对话和上下文记忆。

### 📂 强大的虚拟文件系统 (VFS)
- **混合存储架构**:
  - **System (只读)**: 包含预置的系统文件、壁纸和文档。
  - **C Drive (读写)**: 基于浏览器 `localStorage` 的持久化存储，刷新页面数据不丢失。
- **文件操作**: 支持创建文件/文件夹、重命名、删除、复制、剪切、粘贴。
- **拖拽上传**: 支持直接从电脑桌面拖拽文件到文件管理器中进行上传。
- **文件预览**: 内置图片查看器和文本编辑器，支持直接打开相应格式的文件。

### 🛠️ 任务栏与开始菜单
- **全局搜索**: 实时检索已安装的应用程序。
- **世界时钟**: 点击时间区域可查看本地及全球主要城市（纽约、伦敦、东京）的实时时间。
- **开始菜单**: 经典的应用程序启动器，包含用户资料展示和关机功能。

---

## 🏗️ 技术栈 (Tech Stack)

*   **前端框架**: [React 19](https://react.dev/)
*   **开发语言**: [TypeScript](https://www.typescriptlang.org/)
*   **样式方案**: [Tailwind CSS](https://tailwindcss.com/) (含自定义动画配置)
*   **图标库**: [Lucide React](https://lucide.dev/)
*   **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai)
*   **构建工具**: Vite (推荐) 或 Create React App

---

## 📂 项目结构 (Project Structure)

```text
/
├── index.html              # 应用入口 (包含 Tailwind CDN 配置)
├── index.tsx               # React 挂载点
├── App.tsx                 # 核心控制器 (窗口管理、状态分发)
├── types.ts                # TypeScript 类型定义
│
├── components/
│   ├── apps/               # 应用程序组件
│   │   ├── ButlerChat.tsx      # AI 聊天助手 (Gemini)
│   │   ├── FileManagerApp.tsx  # 文件资源管理器 (核心应用)
│   │   ├── TextEditorApp.tsx   # 文本编辑器
│   │   ├── GalleryApp.tsx      # 图片库
│   │   ├── PictureViewerApp.tsx# 图片查看器
│   │   ├── ControlPanelApp.tsx # 控制面板 (个性化设置)
│   │   └── AboutApp.tsx        # 关于页面
│   │
│   └── ui/                 # 系统 UI 组件
│       ├── Window.tsx          # 通用窗口容器 (处理拖拽/缩放/动画)
│       ├── Taskbar.tsx         # 底部任务栏 (搜索/时钟/托盘)
│       ├── StartMenu.tsx       # 开始菜单
│       └── TaskView.tsx        # 任务视图 (多桌面管理)
│
├── services/
│   ├── fileSystemService.ts    # 虚拟文件系统服务 (CRUD/持久化逻辑)
│   └── geminiService.ts        # AI API 通信服务
│
└── data/
    └── fileSystem.ts       # 文件系统初始数据/代理
```

---

## 🎮 操作指南 (User Guide)

1.  **启动应用**: 点击桌面图标或通过开始菜单/任务栏搜索打开应用。
2.  **窗口操作**:
    *   **移动**: 拖拽窗口标题栏。
    *   **缩放**: 拖拽窗口边缘或角落。
    *   **最大化**: 双击标题栏或点击最大化按钮。
3.  **多桌面管理 (Task View)**:
    *   点击任务栏上的“任务视图”图标（搜索框右侧）。
    *   将底部的窗口缩略图**拖拽**到顶部的 "Desktop 1" 或 "Desktop 2" 卡片上以移动窗口。
    *   右键点击缩略图可使用上下文菜单。
4.  **文件管理**:
    *   双击进入文件夹。
    *   右键空白处或文件可唤出上下文菜单 (新建、复制、粘贴等)。
    *   将本地文件拖入窗口即可上传到当前目录 (仅限 C 盘)。
5.  **个性化**:
    *   打开 "Control Panel" (控制面板) 修改壁纸、强调色或切换日夜主题。

---

## ⚙️ 配置说明

### AI API Key
项目依赖 Google Gemini API。API Key 通过环境变量 `process.env.API_KEY` 注入。

### 本地存储
用户数据（C 盘文件、主题设置）存储在浏览器的 `LocalStorage` 中，键名分别为：
- `rakko_fs_c_drive`: 文件系统数据
- `theme`: 主题偏好

---

## 📜 版权信息

**Rakko Workplace** is a concept project designed by Rakko Industries.
All rights reserved.
