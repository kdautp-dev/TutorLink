import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { SUBJECT_OPTIONS, USER_ROLES } from "@/lib/constants";
import { createUserProfile } from "@/lib/firestore";
import { parseSubjects } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { authUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: USER_ROLES.STUDENT,
    subjects: "",
    bio: "",
  });
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

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured yet. Add your environment variables first.");
      return;
    }

    setSubmitting(true);

    try {
      const credentials = await createUserWithEmailAndPassword(auth, form.email, form.password);

      await createUserProfile(credentials.user.uid, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        subjects: parseSubjects(form.subjects),
        bio: form.bio.trim(),
      });

      router.push("/");
    } catch (submitError) {
      setError(submitError.message || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} />
        </div>
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
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value={USER_ROLES.STUDENT}>Student</option>
            <option value={USER_ROLES.TUTOR}>Tutor</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="subjects">Subjects</label>
          <input
            id="subjects"
            name="subjects"
            list="subject-suggestions"
            placeholder="Calculus, Physics, English"
            value={form.subjects}
            onChange={handleChange}
          />
          <datalist id="subject-suggestions">
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" name="bio" rows="4" value={form.bio} onChange={handleChange} />
        </div>
        {!isFirebaseConfigured && (
          <p className="helper-text">Firebase is not configured yet. Sign-up will work after you add env vars.</p>
        )}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
        <p className="helper-text">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
