export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong'

export type PasswordStrengthResult = {
  score: number
  level: PasswordStrengthLevel
  isStrong: boolean
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  const score = checks.filter(Boolean).length

  let level: PasswordStrengthLevel = 'weak'
  if (score >= 5) {
    level = 'strong'
  } else if (score >= 3) {
    level = 'medium'
  }

  return {
    score,
    level,
    isStrong: score >= 5,
  }
}
