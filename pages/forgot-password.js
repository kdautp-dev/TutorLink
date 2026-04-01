import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured yet. Add your environment variables first.");
      return;
    }

    setSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent. Use the link in your inbox to choose a new password.");
    } catch (submitError) {
      setError(submitError.message || "Unable to send password reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <form className="card auth-card stack" onSubmit={handleSubmit}>
        <h1>Reset your password</h1>
        <p className="helper-text">
          Enter the email you used for Homework4Cash and Firebase will send you a reset link.
        </p>
        <div className="field">
          <label htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {message && <p className="helper-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset email"}
        </button>
        <p className="helper-text">
          Back to <Link href="/login">log in</Link>
        </p>
      </form>
    </section>
  );
}
