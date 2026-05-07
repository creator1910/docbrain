import Link from 'next/link'
import { signOut } from '@/app/(auth)/login/actions'
import styles from './header-bar.module.css'

interface Props {
  onUpload?: boolean  // whether to show the + Dokument button (handled by parent via client component)
}

export function HeaderBar({ onUpload }: Props) {
  return (
    <header className={styles.bar}>
      <Link href="/documents" className={styles.logo}>
        Mein Archiv
      </Link>

      <div className={styles.right}>
        <nav className={styles.nav}>
          <Link href="/documents" className={styles.navLink} data-active="true">
            Dokumente
          </Link>
          <Link href="/kalender" className={styles.navLink}>
            Kalender
          </Link>
          <Link href="/einstellungen" className={styles.navLink}>
            Einstellungen
          </Link>
        </nav>

        <form action={signOut}>
          <button type="submit" className={styles.btnSignOut}>
            Abmelden
          </button>
        </form>
      </div>
    </header>
  )
}
