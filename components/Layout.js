import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function Layout({ children }) {
  const router = useRouter();
  const { authUser, profile } = useAuth();

  async function handleLogout() {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav-bar">
          <Link href="/" className="brand">
            TutorLink
          </Link>
          <nav className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/assignments">Assignments</Link>
            <Link href="/tutors">Tutor Finder</Link>
            {authUser && <Link href="/create-post">Post Assignment</Link>}
            {authUser && <Link href="/create-tutor-listing">Become a Tutor</Link>}
            {authUser && profile && <Link href={`/profile/${profile.uid}`}>Profile</Link>}
            {authUser && !profile && <Link href="/complete-profile">Complete Profile</Link>}
            {!authUser && <Link href="/login">Log In</Link>}
            {!authUser && <Link href="/signup">Sign Up</Link>}
            {authUser && (
              <button type="button" className="button button-secondary" onClick={handleLogout}>
                Log Out
              </button>
            )}
          </nav>
        </div>
        {!isFirebaseConfigured && (
          <div className="container config-banner">
            Firebase env vars are missing. Add your `NEXT_PUBLIC_FIREBASE_*` values to enable auth and data.
          </div>
        )}
      </header>
      <main className="container page-content">{children}</main>
    </div>
  );
}
