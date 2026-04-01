import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { reload, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { requiresEmailVerification } from "@/lib/utils";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { authUser } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authUser) {
      router.replace("/login");
      return;
    }

    if (!requiresEmailVerification(authUser)) {
      router.replace("/");
    }
  }, [authUser, router]);

  async function handleResend() {
    if (!auth?.currentUser) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("Verification email sent. Check your inbox and spam folder.");
    } catch (sendError) {
      setError(sendError.message || "Unable to resend verification email.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    if (!auth?.currentUser) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        router.push("/");
        return;
      }
      setMessage("Your email still shows as unverified. Open the link in your inbox, then try again.");
    } catch (refreshError) {
      setError(refreshError.message || "Unable to refresh verification status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  }

  return (
    <section className="auth-shell">
      <div className="card auth-card stack">
        <h1>Verify your email</h1>
        <p className="helper-text">
          We sent a verification link to <strong>{authUser?.email}</strong>. Open it before using Homework4Cash.
        </p>
        {message && <p className="helper-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <div className="actions-row">
          <button type="button" className="button" onClick={handleRefresh} disabled={busy}>
            {busy ? "Checking..." : "I verified my email"}
          </button>
          <button type="button" className="button button-secondary" onClick={handleResend} disabled={busy}>
            Resend verification email
          </button>
        </div>
        <p className="helper-text">
          Used the wrong email? <button type="button" className="link-button" onClick={handleSignOut}>Log out</button>
        </p>
        <p className="helper-text">
          Need help signing in? <Link href="/forgot-password">Reset your password</Link>
        </p>
      </div>
    </section>
  );
}
