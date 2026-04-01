import Link from "next/link";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function Layout({ children }) {
  const { authUser, profile } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav-bar">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              ★
            </span>
            <span>Homework4Cash</span>
          </Link>
          <nav className="nav-links">
            <Link href="/assignments">Assignments</Link>
            <Link href="/tutors">Helper Finder</Link>
            <Link href="/info">Info</Link>
            <Link href="/post">Post</Link>
            {authUser && (
              <Link href="/bookmarks" className="icon-link" aria-label="Bookmarks">
                <svg viewBox="0 0 24 24" fill="none" className="nav-svg" aria-hidden="true">
                  <path
                    d="M7 4.75h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.75a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
            <Link href="/account" className="icon-link" aria-label={authUser ? "Account" : "Log in or sign up"}>
              <svg viewBox="0 0 24 24" fill="none" className="nav-svg" aria-hidden="true">
                <path
                  d="M12 12a3.75 3.75 0 1 0 0-7.5A3.75 3.75 0 0 0 12 12Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M5 19.25c1.32-3.08 3.76-4.75 7-4.75s5.68 1.67 7 4.75"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </nav>
        </div>
        {!isFirebaseConfigured && (
          <div className="container config-banner">
            Firebase env vars are missing. Add your `NEXT_PUBLIC_FIREBASE_*` values to enable auth and data.
          </div>
        )}
      </header>
      <main className="container page-content">{children}</main>
      <footer className="site-footer">
        <div className="container footer-bar">© 2026 Homework4Cash. All Rights Reserved.</div>
      </footer>
    </div>
  );
}
