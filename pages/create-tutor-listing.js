import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { getTutorListing, upsertTutorListing } from "@/lib/firestore";
import { parseSubjects } from "@/lib/utils";

function CreateTutorListingContent() {
  const router = useRouter();
  const { authUser, profile } = useAuth();
  const [form, setForm] = useState({
    title: "",
    bio: "",
    subjects: "",
    hourlyRate: "",
    availability: "",
    contactInfo: "",
    preferredPaymentMethod: "",
    active: true,
  });
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      if (!authUser || !profile) {
        setLoadingExisting(false);
        return;
      }

      const listing = await getTutorListing(authUser.uid);

      if (listing) {
        setForm({
          title: listing.title || "",
          bio: listing.bio || "",
          subjects: (listing.subjects || []).join(", "),
          hourlyRate: listing.hourlyRate?.toString() || "",
          availability: listing.availability || "",
          contactInfo: listing.contactInfo || "",
          preferredPaymentMethod: listing.preferredPaymentMethod || "",
          active: listing.active ?? true,
        });
      }

      setLoadingExisting(false);
    }

    loadExisting();
  }, [authUser, profile]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.bio.trim() || !form.hourlyRate || !form.contactInfo.trim()) {
      setError("Title, bio, hourly rate, and contact info are required.");
      return;
    }

    if (Number(form.hourlyRate) <= 0) {
      setError("Hourly rate must be greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      await upsertTutorListing(authUser.uid, {
        name: profile.name,
        email: profile.email,
        title: form.title.trim(),
        bio: form.bio.trim(),
        subjects: parseSubjects(form.subjects),
        hourlyRate: form.hourlyRate,
        availability: form.availability.trim(),
        contactInfo: form.contactInfo.trim(),
        preferredPaymentMethod: form.preferredPaymentMethod.trim(),
        active: form.active,
      });

      router.push("/tutors");
    } catch (submitError) {
      setError(submitError.message || "Unable to save tutor listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div>
        <h1>Create your tutor listing</h1>
        <p className="helper-text">
          Publish a short listing so students can find your expertise, rate, and availability.
        </p>
      </div>

      {profile && (
        <form className="card form-card" onSubmit={handleSubmit}>
          {loadingExisting && <p className="helper-text">Loading your current listing...</p>}
          <div className="field">
            <label htmlFor="title">Listing title</label>
            <input
              id="title"
              name="title"
              placeholder="Calculus tutor for exams and homework"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" rows="5" value={form.bio} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="subjects">Subjects</label>
            <input
              id="subjects"
              name="subjects"
              list="tutor-listing-subjects"
              placeholder="Calculus, Physics, Algebra"
              value={form.subjects}
              onChange={handleChange}
            />
            <datalist id="tutor-listing-subjects">
              {SUBJECT_OPTIONS.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="hourlyRate">Hourly rate ($)</label>
            <input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="1"
              step="0.01"
              value={form.hourlyRate}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="availability">Availability</label>
            <input
              id="availability"
              name="availability"
              placeholder="Weeknights after 6 PM, weekends"
              value={form.availability}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="contactInfo">Contact info</label>
            <input
              id="contactInfo"
              name="contactInfo"
              placeholder="Phone number, Instagram, Discord, or preferred contact"
              value={form.contactInfo}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="preferredPaymentMethod">Preferred payment method</label>
            <input
              id="preferredPaymentMethod"
              name="preferredPaymentMethod"
              placeholder="Venmo, Cash App, PayPal, cash"
              value={form.preferredPaymentMethod}
              onChange={handleChange}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
            />
            Keep this listing visible in Tutor Finder
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Saving..." : "Save tutor listing"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function CreateTutorListingPage() {
  return (
    <ProtectedRoute>
      <CreateTutorListingContent />
    </ProtectedRoute>
  );
}
