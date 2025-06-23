// app/settings/page.jsx
import ResetPasswordForm from './ResetPasswordForm'

export default function SettingsPage({ searchParams }) {
  const resetMode = searchParams.pwReset === '1'

  if (!resetMode) {
    return (
      <p className="pt-32 text-center">
        Settings page WIP…
      </p>
    )
  }

  return <ResetPasswordForm />
}
