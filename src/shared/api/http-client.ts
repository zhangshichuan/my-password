/**
 * 通用 HTTP 请求工具。
 * 统一处理 JSON 请求、鉴权头和错误响应解析。
 */

interface RequestJsonOptions extends RequestInit {
  token?: string | null
}

/**
 * 发送 JSON 请求并返回解析后的响应数据。
 * @param url 请求地址
 * @param options fetch 选项与可选 token
 * @returns 解析后的 JSON 响应
 */
export async function requestJson<T>(url: string, options: RequestJsonOptions = {}): Promise<T> {
  const { token, headers, ...fetchOptions } = options

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response.json()
}
