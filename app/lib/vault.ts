/**
 * 金库加密工具（仅客户端使用）
 * 封装 PBKDF2 密钥派生和 AES-GCM 加解密
 *
 * 所有函数委托给 lib/password.ts 实现
 */
import { decryptSecret, deriveKey, encryptSecret, resolveMasterKey, verifyMasterPassword } from './password'

// 重新导出
export { deriveKey, encryptSecret, decryptSecret, resolveMasterKey, verifyMasterPassword }
