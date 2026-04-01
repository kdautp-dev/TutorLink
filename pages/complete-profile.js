import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { SUBJECT_OPTIONS, USER_ROLES } from "@/lib/constants";
import { createUserProfile, upsertUserProfile } from "@/lib/firestore";
import { parseSubjects } from "@/lib/utils";

function CompleteProfileContent() {
  const router = useRouter();
  const { authUser, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    role: USER_ROLES.STUDENT,
    subjects: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        role: profile.role || USER_ROLES.STUDENT,
        subjects: (profile.subjects || []).join(", "),
        bio: profile.bio || "",
      });
      return;
    }

    if (authUser) {
      setForm((current) => ({
        ...current,
        name: current.name || authUser.displayName || "",
      }));
    }
  }, [authUser, profile]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!authUser) {
      setError("You must be logged in.");
      return;
    }

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const profilePayload = {
        name: form.name.trim(),
        email: authUser.email,
        role: form.role,
        subjects: parseSubjects(form.subjects),
        bio: form.bio.trim(),
      };

      if (profile) {
        await upsertUserProfile(authUser.uid, profilePayload);
      } else {
        await createUserProfile(authUser.uid, profilePayload);
      }

      await refreshProfile();
      router.push(form.role === USER_ROLES.STUDENT ? "/post?type=assignment" : "/");
    } catch (submitError) {
      setError(submitError.message || "Unable to save your profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div>
        <h1>Complete your profile</h1>
        <p className="helper-text">
          Your sign-in is active, but your profile document needs to be saved before role-based features unlock.
        </p>
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} />
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
            list="complete-profile-subjects"
            placeholder="Calculus, Physics, English"
            value={form.subjects}
            onChange={handleChange}
          />
          <datalist id="complete-profile-subjects">
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" name="bio" rows="4" value={form.bio} onChange={handleChange} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}

export default function CompleteProfilePage() {
  return (
    <ProtectedRoute>
      <CompleteProfileContent />
    </ProtectedRoute>
  );
}
