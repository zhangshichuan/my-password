/**
 * vault 领域统一导出。
 * 方便页面层从单一入口获取常用业务能力。
 */

export {
  decrypt,
  decryptSecret,
  deriveKey,
  encrypt,
  encryptSecret,
  generateIV,
  resolveMasterKey,
  verifyMasterPassword,
} from './crypto/encryption'
export { generatePassword } from './password/generator'
export { evaluatePasswordStrength } from './password/strength'
