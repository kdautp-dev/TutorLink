import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const router = useRouter();
  const { authUser, profile } = useAuth();

  async function handleLogout() {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  }

  if (!authUser) {
    return (
      <section className="auth-shell">
        <div className="card auth-card stack">
          <h1>Account</h1>
          <p className="helper-text">Log in or create an account to post, bookmark listings, and manage your profile.</p>
          <div className="actions-row">
            <Link href="/login" className="button">
              Log in
            </Link>
            <Link href="/signup" className="button button-secondary">
              Sign up
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="card auth-card stack">
        <h1>Account</h1>
        <p className="helper-text">
          Signed in as <strong>{profile?.name || authUser.email}</strong>.
        </p>
        <div className="actions-row">
          {profile ? (
            <Link href={`/profile/${profile.uid}`} className="button">
              View profile
            </Link>
          ) : (
            <Link href="/complete-profile" className="button">
              Complete profile
            </Link>
          )}
          <button type="button" className="button button-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </section>
  );
}
