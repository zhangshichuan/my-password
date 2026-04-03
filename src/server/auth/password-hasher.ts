/**
 * 服务端认证服务（仅服务端使用）
 * 基于 Argon2id 密码哈希
 */

/**
 * 使用 Argon2id 哈希登录密码
 * @param password 登录密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const argon2 = await import('argon2')

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  })
}

/**
 * 验证登录密码
 * @param password 输入的密码
 * @param hashedPassword 数据库中存储的哈希
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const argon2 = await import('argon2')

  try {
    return await argon2.verify(hashedPassword, password)
  } catch {
    return false
  }
}
