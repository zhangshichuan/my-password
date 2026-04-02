const HEX_PATTERN = /^[a-f0-9]+$/i
const AES_GCM_IV_HEX_LENGTH = 24
const AES_GCM_TAG_HEX_LENGTH = 32

/**
 * 创建密码时的服务端输入校验。
 * 这里不验证明文语义，只校验密文、IV 和关键字段的结构是否合法。
 */
export function validatePasswordCreateInput(input: {
  username?: unknown
  encryptedSecret?: unknown
  iv?: unknown
  categoryId?: unknown
}) {
  if (typeof input.username !== 'string' || input.username.trim() === '') {
    return '用户名不能为空'
  }

  if (typeof input.categoryId !== 'string' || input.categoryId.trim() === '') {
    return '分类不能为空'
  }

  return validateEncryptedPayload(input.encryptedSecret, input.iv)
}

/**
 * 更新密码时的服务端输入校验。
 * 如果要更新密文，必须同时提交 encryptedSecret 和 iv，避免数据库进入半更新状态。
 */
export function validatePasswordUpdateInput(input: {
  username?: unknown
  encryptedSecret?: unknown
  iv?: unknown
  categoryId?: unknown
}) {
  if (input.username !== undefined && (typeof input.username !== 'string' || input.username.trim() === '')) {
    return '用户名不能为空'
  }

  if (input.categoryId !== undefined && (typeof input.categoryId !== 'string' || input.categoryId.trim() === '')) {
    return '分类不能为空'
  }

  const encryptedProvided = input.encryptedSecret !== undefined
  const ivProvided = input.iv !== undefined

  if (encryptedProvided !== ivProvided) {
    return '更新密文时必须同时提供 encryptedSecret 和 iv'
  }

  if (!encryptedProvided) {
    return null
  }

  return validateEncryptedPayload(input.encryptedSecret, input.iv)
}

function validateEncryptedPayload(encryptedSecret: unknown, iv: unknown) {
  if (typeof encryptedSecret !== 'string' || typeof iv !== 'string') {
    return '密文格式不正确'
  }

  if (iv.length !== AES_GCM_IV_HEX_LENGTH || !HEX_PATTERN.test(iv)) {
    return 'iv 格式不正确'
  }

  // encryptedSecret 约定格式为 ciphertext:authTag。
  const [ciphertext, authTag, ...rest] = encryptedSecret.split(':')
  if (rest.length > 0 || !ciphertext || !authTag) {
    return 'encryptedSecret 格式不正确'
  }

  if (!HEX_PATTERN.test(ciphertext) || !HEX_PATTERN.test(authTag)) {
    return 'encryptedSecret 必须为十六进制'
  }

  if (authTag.length !== AES_GCM_TAG_HEX_LENGTH) {
    return 'auth tag 长度不正确'
  }

  return null
}
