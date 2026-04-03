/**
 * auth 领域统一导出。
 * 只暴露页面层和其他 feature 需要依赖的稳定能力。
 */

export { login, register } from './api/client'
export { useAuthRedirect } from './hooks/use-auth-redirect'
export { useLoginPage } from './hooks/use-login-page'
export { useRegisterPage } from './hooks/use-register-page'
export { getCurrentUser, isAuthenticated, logout } from './model/auth-storage'
