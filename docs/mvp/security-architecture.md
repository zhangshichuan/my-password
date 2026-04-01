# MVP 安全架构设计

## 一、核心安全原则

遵循**零信任架构**，所有敏感数据在客户端加密，服务器只存储密文。

即使数据库泄露，攻击者也无法解密用户密码。

## 二、双密码机制

### 2.1 两套密码的职责

| 密码类型 | 用途                    | 存储位置                     | 传输         |
| -------- | ----------------------- | ---------------------------- | ------------ |
| 登录密码 | 认证 app 登录，获取 JWT | DB: passwordHash (Argon2)    | 发送到服务器 |
| 主密码   | 解密金库钥匙            | **不存储**（用户记在本子上） | 从不发送     |

### 2.2 为什么分开

- **登录密码**：可能被暴力破解、钓鱼、中间人攻击
- **主密码**：仅用于本地解密，不经过网络传输

## 三、加密方案

### 3.1 技术选型

| 用途     | 算法        | 环境     | 说明                        |
| -------- | ----------- | -------- | --------------------------- |
| 密钥派生 | PBKDF2      | 仅客户端 | 用 email 作为固定盐派生密钥 |
| 密码哈希 | Argon2id    | 仅服务端 | 防暴力攻击                  |
| 数据加密 | AES-256-GCM | 仅客户端 | 对称加密，认证加密模式      |
| 用户认证 | JWT         | 仅服务端 | 无状态 token                |

### 3.2 执行环境划分

| 函数       | 服务端 | 客户端 | 说明                          |
| ---------- | ------ | ------ | ----------------------------- |
| generateIV | ❌     | ✅     | 客户端生成每次加密的 IV       |
| deriveKey  | ❌     | ✅     | **仅客户端**：PBKDF2 派生密钥 |
| encrypt    | ❌     | ✅     | 客户端加密密码后发送          |
| decrypt    | ❌     | ✅     | 客户端解密查看密码            |

**核心原则**：主密码**绝不离开客户端**，服务端只存储密文，不参与任何加解密操作。

### 3.3 密钥派生流程（客户端）

```
用户输入主密码 + 用户 email（作为固定盐）
       ↓
    PBKDF2(password, email, iterations=100000)
       ↓
    固定密钥 Ke (256 bits，用于解密所有密码)
```

**注意**：每个用户的 email 不同，所以即使主密码相同，不同用户的密钥也不同。

### 3.4 加密流程（客户端）

```
明文密码 (用户输入或密码生成器)
       ↓
Ke (来自 PBKDF2 派生)
       ↓
随机生成 IV (每条密码不同)
       ↓
AES-256-GCM (Ke, IV, 明文) → encryptedSecret
       ↓
存储: encryptedSecret + IV
```

## 四、数据模型

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String     // 登录密码 Argon2 哈希
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  categories   Category[]
  passwords    Password[]
}

model Category {
  id         String     @id @default(cuid())
  name       String     // 分类名称：如 "工作"、"社交"、"家门"
  type       String     // 类型：website/app/doorlock/card/other
  userId     String
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  passwords  Password[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Password {
  id              String   @id @default(cuid())
  username        String   // 用户名（明文）
  encryptedSecret String   // 加密后的密码
  iv              String   // AES-GCM 初始向量
  notes           String?  // 备注
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 五、注册流程

```
1. 用户输入 email、登录密码、主密码
       ↓
2. 客户端校验：主密码 ≠ 登录密码
       ↓
3. 发送登录密码到服务器 → Argon2 哈希 → 存入 passwordHash
       ↓
4. 注册完成（服务端无需存储任何主密码相关信息）
```

**注意**：

- 主密码从不发送到服务器
- 服务端不存储盐或验证数据
- 密钥派生和解密都在客户端完成

## 六、登录流程

```
1. email + 登录密码 → 服务器验证 → 返回 JWT
       ↓
2. 客户端请求获取密码列表 GET /api/passwords
       ↓
3. 用户输入主密码
       ↓
4. 客户端用 PBKDF2(masterPassword, email) 派生 Ke
       ↓
5. 客户端用 Ke + iv 解密 encryptedSecret
       ↓
6. 解密成功 → 金库解锁
   解密失败 → 提示主密码错误
```

## 七、添加密码流程（客户端执行）

```
1. 用户输入名称、用户名、密码（手动或生成器）
       ↓
2. 客户端已有 Ke（已解锁状态）
       ↓
3. 客户端生成随机 IV
       ↓
4. AES-256-GCM(Ke, IV, 密码) → encryptedSecret
       ↓
5. 发送: username + encryptedSecret + IV + categoryId 到服务端
```

## 八、查看密码流程（客户端执行）

```
1. 从服务端获取密码列表（encryptedSecret + IV）
       ↓
2. 用户已输入主密码（客户端有 Ke）
       ↓
3. AES-256-GCM-Decrypt(encryptedSecret, Ke, IV) → 明文密码
       ↓
4. 显示给用户
```

## 九、安全性分析

### 9.1 数据库泄露场景

攻击者拿到：email, passwordHash, encryptedSecret, IV

| 攻击方式                 | 防护                       |
| ------------------------ | -------------------------- |
| 暴力破解登录密码         | Argon2 时间/内存硬度       |
| 暴力破解 encryptedSecret | 没有主密码，无法派生 Ke    |
| 彩虹表攻击               | email 作为盐，每个用户不同 |

### 9.2 传输安全

- HTTPS 加密传输（标准 TLS）
- 主密码从不传输
- JWT token 有时效性

### 9.3 客户端安全

| 威胁           | 防护                         |
| -------------- | ---------------------------- |
| XSS 窃取 Ke    | HttpOnly cookie + CSP        |
| CSRF           | CSRF token                   |
| 本地存储被读取 | Ke 存在内存中，刷新/关闭清除 |

## 十、密码生成器

在客户端使用 Web Crypto API：

```typescript
// 生成随机密码
const randomBytes = new Uint8Array(length)
crypto.getRandomValues(randomBytes)
const password = Array.from(randomBytes)
  .map((byte) => chars[byte % chars.length])
  .join('')

// 生成随机 IV (12 bytes for AES-GCM)
const iv = new Uint8Array(12)
crypto.getRandomValues(iv)
```

## 十一、实现顺序

1. 基础框架 + Prisma + SQLite
2. 用户注册/登录（JWT + Argon2）
3. 主密码设置 + 客户端校验
4. 分类 CRUD
5. 密码 CRUD（加密/解密）
6. 密码生成器
7. 搜索/筛选功能

---

**最后更新**：2026-04-01
