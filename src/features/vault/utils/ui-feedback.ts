export function getUiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    const message = error.message.trim()
    if (message) {
      return message
    }
  }

  return fallbackMessage
}

export function logUiError(scope: string, error: unknown) {
  console.error(`[vault-ui] ${scope}`, error)
}
