# API 文档

## 认证接口

### 注册

```
POST /api/auth/register
```

**请求体:**

```json
{
  "email": "user@example.com",
  "loginPassword": "xxx"
}
```

**响应:** `201`

```json
{
  "message": "注册成功",
  "userId": "xxx"
}
```

**注意:**

- 主密码不在此接口传输，注册时仅需设置登录密码
- 主密码在首次解锁时由用户本地设置，通过 PBKDF2(masterPassword, email) 派生密钥

### 登录

```
POST /api/auth/login
```

**请求体:**

```json
{
  "email": "user@example.com",
  "password": "xxx"
}
```

**响应:** `200`

```json
{
  "token": "jwt-token",
  "userId": "xxx"
}
```

## 分类接口

### 获取所有分类

```
GET /api/categories
```

**请求头:** `Authorization: Bearer <jwt-token>`
**响应:** `200`

```json
[
  { "id": "xxx", "name": "工作", "type": "website" },
  { "id": "xxx", "name": "社交", "type": "app" }
]
```

### 创建分类

```
POST /api/categories
```

**请求头:** `Authorization: Bearer <jwt-token>`
**请求体:**

```json
{
  "name": "购物",
  "type": "website"
}
```

**type 可选值:** `website`, `app`, `doorlock`, `card`, `other`
**响应:** `201`

### 更新分类

```
PUT /api/categories/[id]
```

**请求头:** `Authorization: Bearer <jwt-token>`
**请求体:**

```json
{
  "name": "新名称",
  "type": "app"
}
```

**响应:** `200`

### 删除分类

```
DELETE /api/categories/[id]
```

**请求头:** `Authorization: Bearer <jwt-token>`
**响应:** `200`

```json
{ "message": "删除成功" }
```

## 密码接口

### 获取所有密码

```
GET /api/passwords
```

**请求头:** `Authorization: Bearer <jwt-token>`
**查询参数:** `?categoryId=xxx` (可选，按分类筛选)
**响应:** `200`

```json
[
  {
    "id": "xxx",
    "username": "user@email.com",
    "encryptedSecret": "密文:认证标签",
    "iv": "初始向量",
    "notes": "备注",
    "categoryId": "xxx",
    "category": { "id": "xxx", "name": "工作", "type": "website" }
  }
]
```

### 创建密码

```
POST /api/passwords
```

**请求头:** `Authorization: Bearer <jwt-token>`
**请求体:**

```json
{
  "username": "user@email.com",
  "encryptedSecret": "密文:认证标签",
  "iv": "初始向量",
  "notes": "备注",
  "categoryId": "xxx"
}
```

**注意:** `encryptedSecret` 格式为 `密文:认证标签`，使用 AES-256-GCM 加密时认证标签单独存储，加密时合并。

- `iv` 必须是 24 位十六进制字符串（12 bytes）
- `authTag` 必须是 32 位十六进制字符串（16 bytes）

**响应:** `201`

### 更新密码

```
PUT /api/passwords/[id]
```

**请求头:** `Authorization: Bearer <jwt-token>`
**请求体:**

```json
{
  "username": "新用户名",
  "encryptedSecret": "新密文:新认证标签",
  "iv": "新iv",
  "notes": "新备注",
  "categoryId": "xxx"
}
```

**响应:** `200`

**注意:**

- 若更新密文，必须同时提供 `encryptedSecret` 和 `iv`
- 服务端会校验 `encryptedSecret` 和 `iv` 的格式，非法数据会返回 `400`

### 删除密码

```
DELETE /api/passwords/[id]
```

**请求头:** `Authorization: Bearer <jwt-token>`
**响应:** `200`

```json
{ "message": "删除成功" }
```

---

## 数据模型

### User

| 字段         | 类型   | 说明                 |
| ------------ | ------ | -------------------- |
| id           | String | 主键                 |
| email        | String | 邮箱，唯一           |
| passwordHash | String | 登录密码 Argon2 哈希 |

### Category

| 字段   | 类型   | 说明                                  |
| ------ | ------ | ------------------------------------- |
| id     | String | 主键                                  |
| name   | String | 分类名称：如 "工作"、"社交"、"家门"   |
| type   | String | 类型：website/app/doorlock/card/other |
| userId | String | 所属用户 ID                           |

### Password

| 字段            | 类型    | 说明                              |
| --------------- | ------- | --------------------------------- |
| id              | String  | 主键                              |
| username        | String  | 用户名（明文）                    |
| encryptedSecret | String  | 加密后的密码，格式: 密文:认证标签 |
| iv              | String  | AES-GCM 初始向量 (96 bits)        |
| notes           | String? | 备注                              |
| categoryId      | String  | 所属分类 ID                       |
| userId          | String  | 所属用户 ID                       |

---

## 客户端加解密流程

### 密钥派生

```
PBKDF2(masterPassword, email, iterations=100000) → Ke
```

### 加密

```
Ke + 明文密码 + IV → AES-256-GCM → 密文 + 认证标签
encryptedSecret = 密文:认证标签（组合成一个字符串）
```

### 解密

```
encryptedSecret 按 : 分割 → 密文 + 认证标签
Ke + 密文 + 认证标签 + IV → AES-256-GCM-Decrypt → 明文密码
```

---

**最后更新**：2026-04-01
