# MyPassword

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

```
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

根目录下创建 .env 文件, 参考 .env.example

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
# 请访问 localhost 不要用本地 ip 访问, 因为加密函数不允许在不安全的 http 环境运行
pnpm dev
```

### 运行测试

```bash
pnpm test        # .watch 模式
pnpm test:run    # 单次运行
```

### 代码检查

```bash
pnpm lint        # 完整检查
pnpm lint:tsc    # TypeScript 类型检查
pnpm lint:eslint # ESLint 检查
pnpm lint:prettier # Prettier 格式化
```

## 安全架构

### 双密码职责

| 密码类型 | 用途          | 存储位置                     | 传输         |
| -------- | ------------- | ---------------------------- | ------------ |
| 登录密码 | 认证 app 登录 | DB: Argon2 哈希              | 发送到服务器 |
| 主密码   | 解密金库密钥  | **不存储**（用户记在本子上） | 从不发送     |

### 加密流程

```
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

```
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

---
