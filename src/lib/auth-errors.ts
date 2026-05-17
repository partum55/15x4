type AuthMode = 'login' | 'register'

type AuthErrorLike = {
  code?: string
  message?: string
}

export function getAuthErrorTranslationKey(mode: AuthMode, error?: AuthErrorLike | null) {
  const code = error?.code?.toLowerCase() ?? ''
  const message = error?.message?.toLowerCase() ?? ''

  if (mode === 'login') {
    if (
      code === 'invalid_credentials' ||
      message.includes('invalid login credentials') ||
      message.includes('invalid credentials')
    ) {
      return 'auth.login.errorInvalid'
    }

    if (code.includes('rate_limit') || message.includes('rate limit exceeded')) {
      return 'auth.login.errorRateLimit'
    }

    if (message.includes('email not confirmed')) {
      return 'auth.login.errorEmailNotConfirmed'
    }

    return 'auth.login.errorGeneric'
  }

  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit exceeded')) {
    return 'auth.register.errorRateLimitEmail'
  }

  if (code.includes('rate_limit') || message.includes('rate limit exceeded')) {
    return 'auth.register.errorRateLimit'
  }

  if (
    code === 'user_already_exists' ||
    message.includes('user already registered') ||
    message.includes('already registered')
  ) {
    return 'auth.register.errorEmailTaken'
  }

  if (message.includes('password should be at least')) {
    return 'auth.register.errorPasswordShort'
  }

  if (code === 'weak_password' || message.includes('password') && message.includes('weak')) {
    return 'auth.register.errorPasswordWeak'
  }

  if (message.includes('email address') && message.includes('invalid')) {
    return 'auth.register.errorInvalidEmail'
  }

  if (message.includes('redirect') || message.includes('redirect url')) {
    return 'auth.register.errorRedirect'
  }

  if (message.includes('signup is disabled')) {
    return 'auth.register.errorSignupDisabled'
  }

  return 'auth.register.errorGeneric'
}
