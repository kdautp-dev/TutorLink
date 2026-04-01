import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { createUserProfile, upsertUserProfile } from "@/lib/firestore";
import { parseSubjects } from "@/lib/utils";

function CompleteProfileContent() {
  const router = useRouter();
  const { authUser, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    gradeLevel: "",
    subjectsHelping: "",
    subjectsRequesting: "",
    bio: "",
    qualifications: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        gradeLevel: profile.gradeLevel || "",
        subjectsHelping: (profile.subjectsHelping || []).join(", "),
        subjectsRequesting: (profile.subjectsRequesting || []).join(", "),
        bio: profile.bio || "",
        qualifications: profile.qualifications || "",
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
        gradeLevel: form.gradeLevel.trim(),
        subjectsHelping: parseSubjects(form.subjectsHelping),
        subjectsRequesting: parseSubjects(form.subjectsRequesting),
        bio: form.bio.trim(),
        qualifications: form.qualifications.trim(),
      };

      if (profile) {
        await upsertUserProfile(authUser.uid, profilePayload);
      } else {
        await createUserProfile(authUser.uid, profilePayload);
      }

      await refreshProfile();
      router.push("/");
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
          Your sign-in is active, but your profile document still needs a few details before the rest of the site feels complete.
        </p>
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="gradeLevel">Grade level</label>
          <input
            id="gradeLevel"
            name="gradeLevel"
            placeholder="10th grade, AP Bio, college sophomore"
            value={form.gradeLevel}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label htmlFor="subjectsHelping">Subjects (willing to help)</label>
          <input
            id="subjectsHelping"
            name="subjectsHelping"
            list="complete-profile-help-subjects"
            placeholder="Calculus, Physics, English"
            value={form.subjectsHelping}
            onChange={handleChange}
          />
          <datalist id="complete-profile-help-subjects">
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
            list="complete-profile-request-subjects"
            placeholder="Chemistry, History, Economics"
            value={form.subjectsRequesting}
            onChange={handleChange}
          />
          <datalist id="complete-profile-request-subjects">
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
            placeholder="AP scores, tutoring experience, leadership, awards, coursework"
            value={form.qualifications}
            onChange={handleChange}
          />
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
