<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 1.1 背景

1. 你正在开发一个密码管理器。用户可以存储网站密码、按分类管理、搜索过滤、生成强密码。
2. 架构设计需要考虑扩展性, 比如多端, 多场景.
3. 必须符合零信任架构 & 符合端到端的密码安全标准, 想想 1password 怎么做, 想想 icloud 端到端数据加密怎么做.

### 1.2 技术要求

- 前端框架：React19
- 语言：TypeScript
- 后端：Next.js16
- 数据存储：sqlite + prisma

### 开发规范

- 必须遵循开放封闭原则
- 必须遵循最小化修改原则
- 必须全量中文注释
- 写代码前需要先列出计划与我确认
- 每一次的代码生成后都需要编写并执行单元测试 / 接口测试 / lint 并修复错误

# mvp 版本

@docs/mvp

# v1 版本

@docs/v1
