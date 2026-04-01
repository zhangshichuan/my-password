# MVP 安全架构设计

## 一、核心安全原则

遵循**零信任架构**，所有敏感数据在客户端加密，服务器只存储密文。

即使数据库泄露，攻击者也无法解密用户密码。

## 二、双密码机制

### 2.1 两套密码的职责

| 密码类型 | 用途 | 存储位置 | 传输 |
|---------|------|---------|------|
| 登录密码 | 认证 app 登录，获取 JWT | DB: passwordHash (Argon2) | 发送到服务器 |
| 主密码 | 解密金库钥匙 | **不存储**（用户记在本子上） | 从不发送 |

### 2.2 为什么分开

- **登录密码**：可能被暴力破解、钓鱼、中间人攻击
- **主密码**：仅用于本地解密，不经过网络传输

## 三、加密方案

### 3.1 技术选型

| 用途 | 算法 | 说明 |
|-----|------|-----|
| 密钥派生 | Argon2id | 防暴力攻击，内存硬伤 |
| 数据加密 | AES-256-GCM | 对称加密，认证加密模式 |
| 用户认证 | JWT | 无状态 token |

### 3.2 密钥派生流程

```
用户输入主密码 + 随机盐(salt)
       ↓
    Argon2id(password, salt)
       ↓
    派生密钥 Ke (用于加解密)
```

**Argon2 参数建议**：
- 时间复杂度：3 次迭代
- 内存硬度：64 MB
- 并行度：4

### 3.3 加密流程

```
明文密码 (用户输入或密码生成器)
       ↓
随机生成 IV (每次加密都不同)
       ↓
AES-256-GCM (Ke, IV, 明文) → 密文
       ↓
存储: encryptedSecret + IV
```

## 四、数据模型

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String     // 登录密码 Argon2 哈希
  salt         String     // 主密码派生用的随机盐
  createdAt    DateTime   @default(now())
  categories   Category[]
  passwords    Password[]
}

model Category {
  id         String     @id @default(cuid())
  name       String     // 分类名称：如 "工作"、"社交"、"家门"
  type       String     // 类型：website/app/doorlock/card/other
  userId     String
  user       User       @relation(fields: [userId], references: [id])
  passwords  Password[]
  createdAt  DateTime   @default(now())
}

model Password {
  id              String   @id @default(cuid())
  username        String   // 用户名（明文）
  encryptedSecret String   // 加密后的密码
  iv              String   // AES-GCM 初始向量
  notes           String?  // 备注（加密）
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 五、注册流程

```
1. 用户输入 email、登录密码、主密码
       ↓
2. 客户端校验：主密码 ≠ 登录密码（前端对比）
       ↓
3. 发送登录密码到服务器 → Argon2 哈希 → 存入 passwordHash
       ↓
4. 生成随机 salt
       ↓
5. 主密码 + salt → Argon2id → 派生 Ke
       ↓
6. 用 Ke 加密用户测试数据（验证用）→ 存入 encryptedSecret
       ↓
7. 注册完成
```

**注意**：主密码从第 2 步后就不再使用，不会发送到服务器。

## 六、登录流程

```
1. email + 登录密码 → 服务器验证 → 返回 JWT
       ↓
2. 输入主密码
       ↓
3. 从 DB 获取 salt + encryptedSecret
       ↓
4. 主密码 + salt → Argon2id → 派生 Ke
       ↓
5. 用 Ke 解密 encryptedSecret
       ↓
6. 解密成功 → 金库解锁
   解密失败 → 提示主密码错误
```

## 七、添加密码流程

```
1. 用户输入名称、用户名、密码（手动或生成器）
       ↓
2. 从内存获取 Ke（如已解锁）
       ↓
3. 随机生成 IV
       ↓
4. AES-256-GCM(Ke, IV, 密码) → encryptedSecret
       ↓
5. 保存: username + encryptedSecret + IV + categoryId
```

## 八、修改存储密码流程（encryptedSecret）

```
1. 用户已解锁金库（Ke 在内存中）
       ↓
2. 选择要修改的密码条目
       ↓
3. 输入新密码（手动或生成器）
       ↓
4. 随机生成新 IV
       ↓
5. AES-256-GCM(Ke, IV, 新密码) → 新 encryptedSecret
       ↓
6. 更新 DB: encryptedSecret + IV
```

**特点**：不涉及 Ke 变更，只是替换密文。

## 九、安全性分析

### 9.1 数据库泄露场景

攻击者拿到：email, passwordHash, salt, encryptedSecret, IV

| 攻击方式 | 防护 |
|---------|-----|
| 暴力破解登录密码 | Argon2 时间/内存硬度 |
| 用 encryptedSecret 暴力破解主密码 | 没有主密码，无法派生 Ke |
| 彩虹表攻击 | 随机 salt 防预计算 |

### 9.2 传输安全

- HTTPS 加密传输（标准 TLS）
- 主密码从不传输
- JWT token 有时效性

### 9.3 客户端安全

| 威胁 | 防护 |
|-----|-----|
| XSS 窃取 Ke | HttpOnly cookie + CSP |
| CSRF | CSRF token |
| 本地存储被读取 | Ke 存在内存中，刷新/关闭清除 |

## 十、密码生成器

在客户端使用 Web Crypto API：

```typescript
// 生成随机密码
const password = crypto.getRandomValues(new Uint8Array(length))
  .reduce((acc, byte) => acc + chars[byte % chars.length], '')

// 生成随机 IV
const iv = crypto.getRandomValues(new Uint8Array(12))
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
