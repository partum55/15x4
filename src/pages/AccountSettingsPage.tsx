import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import { getCurrentUser, updateAccount } from '../auth'
import './AccountSettingsPage.css'

export default function AccountSettingsPage() {
  const { t } = useTranslation()
  const user = getCurrentUser()!

  const [name, setName] = useState(user.name)
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const patch: Parameters<typeof updateAccount>[0] = { name: name.trim() }
    if (password) patch.passwordHash = btoa(password)
    updateAccount(patch)
    setPassword('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="account-settings-page">
      <Navbar variant="light" />
      <main className="account-settings-page__main">
        <div className="account-settings-page__container">
          <h1 className="account-settings-page__title">{t('account.settings.title')}</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormField label={t('account.settings.nameLabel')}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </FormField>

            <FormField label={t('account.settings.emailLabel')}>
              <input type="email" value={user.email} readOnly className="account-settings-page__readonly" />
            </FormField>

            <FormField label={t('account.settings.passwordLabel')}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('account.settings.passwordHint')}
                autoComplete="new-password"
              />
            </FormField>

            <div className="account-settings-page__actions">
              <button type="submit" className="auth-form__submit account-settings-page__save-btn">
                {t('account.settings.saveBtn')}
              </button>
              {saved && (
                <span className="account-settings-page__saved">
                  {t('account.settings.savedMessage')}
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
