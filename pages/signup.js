import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import { parseSubjects } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { authUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    gradeLevel: "",
    subjectsHelping: "",
    subjectsRequesting: "",
    bio: "",
    qualifications: "",
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
      await sendEmailVerification(credentials.user);

      await createUserProfile(credentials.user.uid, {
        name: form.name.trim(),
        email: form.email.trim(),
        gradeLevel: form.gradeLevel.trim(),
        subjectsHelping: parseSubjects(form.subjectsHelping),
        subjectsRequesting: parseSubjects(form.subjectsRequesting),
        bio: form.bio.trim(),
        qualifications: form.qualifications.trim(),
      });

      router.push("/verify-email");
    } catch (submitError) {
      setError(submitError.message || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError("Firebase is not configured yet. Add your environment variables first.");
      return;
    }

    setSubmitting(true);

    try {
      const credentials = await signInWithPopup(auth, googleProvider);
      const existingProfile = await getUserProfile(credentials.user.uid);

      if (!existingProfile) {
        await createUserProfile(credentials.user.uid, {
          name: credentials.user.displayName || form.name.trim() || "New member",
          email: credentials.user.email || "",
          gradeLevel: form.gradeLevel.trim(),
          subjectsHelping: parseSubjects(form.subjectsHelping),
          subjectsRequesting: parseSubjects(form.subjectsRequesting),
          bio: form.bio.trim(),
          qualifications: form.qualifications.trim(),
        });
        router.push("/complete-profile");
        return;
      }

      router.push("/");
    } catch (submitError) {
      setError(submitError.message || "Unable to sign up with Google.");
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
          <label htmlFor="gradeLevel">Grade level</label>
          <input
            id="gradeLevel"
            name="gradeLevel"
            placeholder="10th grade, AP Calc AB, college sophomore"
            value={form.gradeLevel}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label htmlFor="subjectsHelping">Subjects (willing to help)</label>
          <input
            id="subjectsHelping"
            name="subjectsHelping"
            list="signup-subject-suggestions"
            placeholder="Calculus, Physics, English"
            value={form.subjectsHelping}
            onChange={handleChange}
          />
          <datalist id="signup-subject-suggestions">
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="subjectsRequesting">Subjects (requesting help)</label>
          <input
            id="subjectsRequesting"
            name="subjectsRequesting"
            list="signup-request-subject-suggestions"
            placeholder="Chemistry, History, Economics"
            value={form.subjectsRequesting}
            onChange={handleChange}
          />
          <datalist id="signup-request-subject-suggestions">
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" name="bio" rows="4" value={form.bio} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="qualifications">Qualifications</label>
          <textarea
            id="qualifications"
            name="qualifications"
            rows="3"
            placeholder="AP scores, tutoring experience, clubs, awards, coursework"
            value={form.qualifications}
            onChange={handleChange}
          />
        </div>
        {!isFirebaseConfigured && (
          <p className="helper-text">Firebase is not configured yet. Sign-up will work after you add env vars.</p>
        )}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
        <button type="button" className="button button-secondary" onClick={handleGoogleSignup} disabled={submitting}>
          Continue with Google
        </button>
        <p className="helper-text">
          Email signups must verify their email before they can use the site.
        </p>
        <p className="helper-text">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
