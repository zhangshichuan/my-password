'use client'

/**
 * 密码生成器组件
 * 可自定义长度和字符类型生成随机强密码
 */
import { generatePassword } from '@/app/lib/password'
import { useCallback, useState } from 'react'

// 组件属性接口
interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void // 生成后的回调
}

/**
 * 密码生成器组件
 * 提供密码长度滑块、字符类型选项，生成随机强密码
 */
export default function PasswordGenerator({ onPasswordGenerated }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16) // 密码长度
  const [options, setOptions] = useState({
    uppercase: true, // 大写字母
    lowercase: true, // 小写字母
    numbers: true, // 数字
    symbols: true, // 特殊字符
  })

  /**
   * 生成密码
   * 根据当前设置生成随机密码并回调
   */
  const handleGenerate = useCallback(() => {
    const password = generatePassword(length, options)
    onPasswordGenerated(password)
  }, [length, options, onPasswordGenerated])

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="font-medium">密码生成器</h3>

      {/* 长度滑块 */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm">
          <span>长度: {length}</span>
        </label>
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 字符类型选项 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.uppercase}
            onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
          />
          大写字母 (A-Z)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.lowercase}
            onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
          />
          小写字母 (a-z)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.numbers}
            onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
          />
          数字 (0-9)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.symbols}
            onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
          />
          特殊字符 (!@#$...)
        </label>
      </div>

      {/* 生成按钮 */}
      <button
        type="button"
        onClick={handleGenerate}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        生成密码
      </button>
    </div>
  )
}
