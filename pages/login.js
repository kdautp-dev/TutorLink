import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { authUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authUser) {
      router.replace("/");
    }
  }, [authUser, router]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured yet. Add your environment variables first.");
      return;
    }

    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push("/");
    } catch (submitError) {
      setError(submitError.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Log in</h1>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        {!isFirebaseConfigured && (
          <p className="helper-text">Firebase is not configured yet. Sign-in will work after you add env vars.</p>
        )}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
        <p className="helper-text">
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </form>
    </section>
  );
}
