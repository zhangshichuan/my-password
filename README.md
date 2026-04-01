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

## 项目结构

```
app/
├── api/                    # API 路由
│   ├── auth/               # 认证接口（登录/注册）
│   ├── categories/        # 分类接口
│   └── passwords/         # 密码接口
├── components/            # React 组件
│   ├── password-card.tsx      # 密码卡片
│   ├── password-form.tsx      # 密码表单
│   ├── password-generator.tsx # 密码生成器
│   └── master-password-modal.tsx # 主密码弹窗
├── lib/                   # 核心库
│   ├── password.ts        # 密码加密解密工具
│   ├── vault-session.ts    # 会话管理（主密码过期）
│   ├── vault.ts           # 金库加解密封装
│   ├── api.ts             # API 客户端
│   ├── auth.ts            # 认证工具
│   └── types.ts           # 类型定义
├── login/                 # 登录页面
├── register/              # 注册页面
└── vault/                 # 密码库页面
    ├── page.tsx           # 密码列表
    ├── categories/       # 分类管理
    └── passwords/         # 密码详情/编辑
docs/
├── mvp/                   # MVP 文档
│   ├── security-architecture.md  # 安全架构设计
│   └── api-spec.md        # API 文档
└── v1/                    # V1 规划
    └── feature-roadmap.md # 功能路线图
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

### 主密码警告

> **重要**：主密码丢失将无法恢复！
>
> 主密码加密您的密码数据。服务器无法恢复此密码，请务必记到本子上！

## 页面说明

| 页面     | 路径                   | 说明                                          |
| -------- | ---------------------- | --------------------------------------------- |
| 登录     | `/login`               | 输入邮箱和登录密码                            |
| 注册     | `/register`            | 创建账号，设置主密码                          |
| 密码库   | `/vault`               | 查看所有密码，点击显示/复制时需输入主密码解锁 |
| 添加密码 | `/vault/passwords/add` | 添加新密码                                    |
| 编辑密码 | `/vault/passwords/:id` | 编辑已有密码                                  |

## 开发规范

- 遵循开放封闭原则
- 全量中文注释
- 每一次代码生成后需编写并执行单元测试

---

> 本项目的编程辅助模型为 minimax2.7
