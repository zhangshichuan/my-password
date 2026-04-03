# MyPassword

> Your private password manager with end-to-end encryption

[中文说明](#中文说明)

## Features

### Core Capabilities

- **Dual-password model**: login password for server-side authentication, master password for local encryption
- **End-to-end encryption**: the master password stays local; the server only stores ciphertext
- **Password categories**: websites (🌐), apps (📱), locks (🔐), bank cards (💳), and others (📝)
- **Password generator**: generate strong passwords with configurable length and character sets
- **Search and filtering**: search by name or note, and filter by category

### Security

- **Zero-trust architecture**: the server stores no usable decryption key
- **AES-256-GCM**: authenticated encryption for vault secrets
- **PBKDF2 key derivation**: 100,000 iterations to slow brute-force attempts
- **10-minute auto-lock**: derived master key expires and requires re-entry

## Tech Stack

| Category                     | Technology                           |
| ---------------------------- | ------------------------------------ |
| Frontend                     | React 19 + Next.js 16                |
| Language                     | TypeScript                           |
| Database                     | SQLite + Prisma                      |
| Encryption                   | Web Crypto API (AES-256-GCM, PBKDF2) |
| Server-side password hashing | Argon2id                             |
| Styling                      | Tailwind CSS                         |
| Testing                      | Vitest                               |

## Start Here

Read these documents before making changes:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - project layers, boundaries, and placement rules

## Project Structure

```text
app/
├── api/                    # Route handlers
├── login/                  # Login route
├── register/               # Register route
└── vault/                  # Vault routes
src/
├── features/               # Business feature code
│   ├── auth/
│   │   ├── api/            # Auth client requests
│   │   ├── components/     # Auth business components
│   │   ├── hooks/          # Auth state logic
│   │   ├── model/          # Auth models and storage
│   │   ├── queries/        # Auth read logic
│   │   ├── server-actions/ # Auth server actions
│   │   └── services/       # Auth orchestration
│   └── vault/
│       ├── api/            # Vault client requests
│       ├── components/     # Vault business components
│       ├── crypto/         # Encryption and decryption logic
│       ├── hooks/          # Vault interaction state
│       ├── model/          # Vault state model
│       ├── password/       # Password generation and strength rules
│       ├── queries/        # Vault read logic
│       ├── server-actions/ # Vault server actions
│       └── services/       # Vault orchestration
├── shared/                 # Cross-feature shared code
│   ├── api/                # Shared request utilities
│   ├── components/         # Shared UI components
│   ├── config/             # Shared configuration
│   ├── constants/          # Shared constants
│   ├── hooks/              # Shared hooks
│   ├── types/              # Shared types
│   └── utils/              # Shared utilities
└── server/                 # Server-only infrastructure
    ├── auth/               # Password hashing, JWT, etc.
    └── db/                 # Prisma and database access
docs/
├── mvp/                    # MVP docs
└── v1/                     # V1 planning
tests/
├── api/                    # API tests
└── unit/                   # Unit tests
```

## Quick Start

Create a `.env` file in the project root based on `.env.example`.

### Install Dependencies

```bash
pnpm install
```

### Initialize the Database

```bash
pnpm db:deploy
```

### Inspect Database Data

```bash
pnpm db:studio
```

### Start the Development Server

```bash
# Use localhost instead of a local IP.
# Web Crypto APIs used for encryption will not run in an insecure HTTP context.
pnpm dev
```

### Run Tests

```bash
pnpm test
pnpm test:run
```

### Run Checks

```bash
pnpm lint
pnpm lint:tsc
pnpm lint:eslint
pnpm lint:prettier
```

## Security Architecture

### Responsibilities of the Two Passwords

| Password Type   | Purpose                         | Storage                 | Transmission       |
| --------------- | ------------------------------- | ----------------------- | ------------------ |
| Login password  | Authenticate the app session    | Database as Argon2 hash | Sent to the server |
| Master password | Derive the vault decryption key | **Never stored**        | Never sent         |

### Encryption Flow

```text
User enters master password + email (used as a fixed salt)
       ↓
PBKDF2(password, email, iterations=100000)
       ↓
Fixed key Ke (256 bits, used to decrypt all stored secrets)
       ↓
Random IV generated per password entry
       ↓
AES-256-GCM (Ke, IV, plaintext) → encryptedSecret
       ↓
Stored data: encryptedSecret + IV
```

### Decryption Flow

```text
Fetch encryptedSecret + IV from the server
       ↓
User enters master password + email
       ↓
PBKDF2(password, email, iterations=100000) → Ke
       ↓
AES-256-GCM-Decrypt(encryptedSecret, Ke, IV) → plaintext
       ↓
Show the password to the user
```

### Master Password Session

- The derived `CryptoKey` is kept only in memory for the current tab
- Nothing is written to `localStorage` or `sessionStorage`
- It expires after 10 minutes without re-unlock
- Refreshing the page requires the master password again

### Master Password Warning

> Important: if you lose the master password, the vault cannot be recovered.
>
> The server cannot recover it for you. Store it somewhere safe offline.

## Pages

| Page          | Route                  | Description                                                                          |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Login         | `/login`               | Sign in with email and login password                                                |
| Register      | `/register`            | Create an account; the master password is set on first unlock                        |
| Vault         | `/vault`               | View saved passwords; showing or copying requires unlocking with the master password |
| Add password  | `/vault/passwords/add` | Create a new password entry                                                          |
| Edit password | `/vault/passwords/:id` | Edit an existing password entry                                                      |

---

## 中文说明

> 您的私人密码管理器 - 端到端加密，永不泄露

## 功能特性

### 核心功能

- **双密码机制**：登录密码 + 主密码分离，登录密码用于服务端认证，主密码用于本地加密
- **端到端加密**：主密码仅存储在本地，服务器只存储密文，即使数据库泄露也无法解密
- **密码分类管理**：支持网站(🌐)、应用(📱)、门锁(🔐)、银行卡(💳)、其他(📝)五种分类
- **密码生成器**：可自定义长度、字符类型的强密码生成工具
- **搜索过滤**：支持按名称、备注搜索，按分类筛选

### 安全特性

- **零信任架构**：服务器不存储任何可用于解密的密钥
- **AES-256-GCM**：军事级加密标准，认证加密模式
- **PBKDF2 密钥派生**：100,000 次迭代，防止暴力破解
- **10 分钟自动锁定**：主密码密钥自动过期，需重新输入

## 技术栈

| 分类           | 技术                                 |
| -------------- | ------------------------------------ |
| 前端框架       | React 19 + Next.js 16                |
| 语言           | TypeScript                           |
| 数据库         | SQLite + Prisma                      |
| 加密           | Web Crypto API (AES-256-GCM, PBKDF2) |
| 服务端密码哈希 | Argon2id                             |
| 样式           | Tailwind CSS                         |
| 测试           | Vitest                               |

## 开发入口

开始开发前，优先阅读以下文档：

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 项目总体分层、边界和放置规则

## 项目结构

```text
app/
├── api/                   # Route Handlers
├── login/                 # 登录页路由
├── register/              # 注册页路由
└── vault/                 # 金库相关路由
src/
├── features/              # 业务功能代码
│   ├── auth/
│   │   ├── api/           # 认证客户端请求
│   │   ├── components/    # 认证业务组件
│   │   ├── hooks/         # 认证状态逻辑
│   │   ├── model/         # 认证模型与存储
│   │   ├── queries/       # 认证读取逻辑
│   │   ├── server-actions/ # 认证服务端动作
│   │   └── services/      # 认证业务编排
│   └── vault/
│       ├── api/           # 金库客户端请求
│       ├── components/    # 金库业务组件
│       ├── crypto/        # 加密解密能力
│       ├── hooks/         # 金库交互状态
│       ├── model/         # 金库状态模型
│       ├── password/      # 密码生成与强度规则
│       ├── queries/       # 金库读取逻辑
│       ├── server-actions/ # 金库服务端动作
│       └── services/      # 金库业务编排
├── shared/                # 跨业务复用代码
│   ├── api/               # 通用请求能力
│   ├── components/        # 全局公共组件
│   ├── config/            # 共享配置
│   ├── constants/         # 通用常量
│   ├── hooks/             # 全局公共 Hook
│   ├── types/             # 共享类型
│   └── utils/             # 通用工具函数
└── server/                # 纯服务端基础设施
    ├── auth/              # 密码哈希、JWT 等能力
    └── db/                # Prisma 与数据库接入
docs/
├── mvp/                   # MVP 文档
└── v1/                    # V1 规划
tests/
├── api/                   # 接口相关测试
└── unit/                  # 单元测试
```

## 快速开始

根目录下创建 `.env` 文件，参考 `.env.example`。

### 安装依赖

```bash
pnpm install
```

### 初始化数据库

```bash
pnpm db:deploy
```

### 查看数据库数据

```bash
pnpm db:studio
```

### 启动开发服务器

```bash
# 请访问 localhost，不要用本地 IP 访问，因为加密函数不允许在不安全的 HTTP 环境运行
pnpm dev
```

### 运行测试

```bash
pnpm test
pnpm test:run
```

### 代码检查

```bash
pnpm lint
pnpm lint:tsc
pnpm lint:eslint
pnpm lint:prettier
```

## 安全架构

### 双密码职责

| 密码类型 | 用途          | 存储位置                     | 传输         |
| -------- | ------------- | ---------------------------- | ------------ |
| 登录密码 | 认证 app 登录 | DB: Argon2 哈希              | 发送到服务器 |
| 主密码   | 解密金库密钥  | **不存储**（用户记在本子上） | 从不发送     |

### 加密流程

```text
用户输入主密码 + email（作为固定盐）
       ↓
PBKDF2(password, email, iterations=100000)
       ↓
固定密钥 Ke (256 bits，用于解密所有密码)
       ↓
随机生成 IV (每条密码不同)
       ↓
AES-256-GCM (Ke, IV, 明文) → encryptedSecret
       ↓
存储: encryptedSecret + IV
```

### 解密流程

```text
从服务器获取: encryptedSecret + IV
       ↓
用户输入主密码 + email
       ↓
PBKDF2(password, email, iterations=100000) → Ke
       ↓
AES-256-GCM-Decrypt(encryptedSecret, Ke, IV) → 明文密码
       ↓
显示给用户
```

### 主密码会话

- 主密码派生出的 `CryptoKey` 仅保存在当前标签页内存中
- 不写入 `localStorage` / `sessionStorage`
- 10 分钟无重新解锁会自动失效
- 刷新页面后需要重新输入主密码

### 主密码警告

> **重要**：主密码丢失将无法恢复！
>
> 主密码加密您的密码数据。服务器无法恢复此密码，请务必记到本子上！

## 页面说明

| 页面     | 路径                   | 说明                                          |
| -------- | ---------------------- | --------------------------------------------- |
| 登录     | `/login`               | 输入邮箱和登录密码                            |
| 注册     | `/register`            | 创建账号（主密码在首次解锁时设置）            |
| 密码库   | `/vault`               | 查看所有密码，点击显示/复制时需输入主密码解锁 |
| 添加密码 | `/vault/passwords/add` | 添加新密码                                    |
| 编辑密码 | `/vault/passwords/:id` | 编辑已有密码                                  |
