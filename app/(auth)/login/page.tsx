import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signIn, signUp } from './actions'
import styles from './login.module.css'

interface Props {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, message, mode } = await searchParams
  const isSignUp = mode === 'signup'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/documents')

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Mein Archiv</h1>
        <p className={styles.tagline}>Dein digitaler Ordner</p>

        {error && (
          <p className={styles.banner} data-type="error">
            {decodeURIComponent(error)}
          </p>
        )}
        {message && (
          <p className={styles.banner} data-type="success">
            {decodeURIComponent(message)}
          </p>
        )}

        {isSignUp ? (
          <>
            <form className={styles.form} action={signUp}>
              <label className={styles.label} htmlFor="email">E-Mail</label>
              <input
                id="email" name="email" type="email"
                required autoComplete="email"
                className={styles.input}
                placeholder="name@example.de"
              />

              <label className={styles.label} htmlFor="password">Passwort</label>
              <input
                id="password" name="password" type="password"
                required autoComplete="new-password" minLength={8}
                className={styles.input}
                placeholder="Mindestens 8 Zeichen"
              />

              <button type="submit" className={styles.btnPrimary}>
                Konto erstellen
              </button>
            </form>

            <p className={styles.hint}>
              Bereits registriert?{' '}
              <Link href="/login" className={styles.link}>Anmelden</Link>
            </p>
          </>
        ) : (
          <>
            <form className={styles.form} action={signIn}>
              <label className={styles.label} htmlFor="email">E-Mail</label>
              <input
                id="email" name="email" type="email"
                required autoComplete="email"
                className={styles.input}
                placeholder="name@example.de"
              />

              <label className={styles.label} htmlFor="password">Passwort</label>
              <input
                id="password" name="password" type="password"
                required autoComplete="current-password"
                className={styles.input}
                placeholder="••••••••"
              />

              <button type="submit" className={styles.btnPrimary}>
                Anmelden
              </button>
            </form>

            <p className={styles.hint}>
              Noch kein Konto?{' '}
              <Link href="/login?mode=signup" className={styles.link}>Registrieren</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
