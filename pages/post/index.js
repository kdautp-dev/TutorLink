import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { AD_TYPES, SUBJECT_OPTIONS } from "@/lib/constants";
import {
  deleteTutorListing,
  getDailyPostCount,
  getTutorListing,
  upsertTutorListing,
  createPost,
} from "@/lib/firestore";
import { parseSubjects, withTimeout } from "@/lib/utils";

function PostPageContent() {
  const router = useRouter();
  const { authUser, profile } = useAuth();
  const [adType, setAdType] = useState(AD_TYPES.ASSIGNMENT);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    subject: SUBJECT_OPTIONS[0],
    gradeLevel: "",
    priceOffered: "",
    deadline: "",
    contactInfo: "",
    preferredPaymentMethod: "",
  });
  const [tutorForm, setTutorForm] = useState({
    title: "",
    bio: "",
    subjects: "",
    gradeLevel: "",
    hourlyRate: "",
    availability: "",
    contactInfo: "",
    preferredPaymentMethod: "",
    active: true,
  });
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [hasExistingListing, setHasExistingListing] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const requestedType = router.query.type;
    if (requestedType === AD_TYPES.TUTOR || requestedType === AD_TYPES.ASSIGNMENT) {
      setAdType(requestedType);
    }
  }, [router.query.type]);

  useEffect(() => {
    async function loadExisting() {
      if (!authUser || !profile) {
        setLoadingExisting(false);
        return;
      }

      try {
        const listing = await getTutorListing(authUser.uid);

        if (listing) {
          setHasExistingListing(true);
          setTutorForm({
            title: listing.title || "",
            bio: listing.bio || "",
            subjects: (listing.subjects || []).join(", "),
            gradeLevel: listing.gradeLevel || "",
            hourlyRate: listing.hourlyRate?.toString() || "",
            availability: listing.availability || "",
            contactInfo: listing.contactInfo || "",
            preferredPaymentMethod: listing.preferredPaymentMethod || "",
            active: listing.active ?? true,
          });
        }
      } finally {
        setLoadingExisting(false);
      }
    }

    loadExisting();
  }, [authUser, profile]);

  function handleAssignmentChange(event) {
    const { name, value } = event.target;
    setAssignmentForm((current) => ({ ...current, [name]: value }));
  }

  function handleTutorChange(event) {
    const { name, value, type, checked } = event.target;
    setTutorForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!profile) {
      setError("Complete your profile before posting.");
      return;
    }

    setSubmitting(true);

    try {
      if (adType === AD_TYPES.ASSIGNMENT) {
        if (
          !assignmentForm.title.trim() ||
          !assignmentForm.description.trim() ||
          !assignmentForm.priceOffered ||
          !assignmentForm.contactInfo.trim()
        ) {
          throw new Error("Title, description, price, and contact info are required.");
        }

        if (Number(assignmentForm.priceOffered) <= 0) {
          throw new Error("Price must be greater than 0.");
        }

        if (assignmentForm.deadline && new Date(assignmentForm.deadline).getTime() <= Date.now()) {
          throw new Error("Deadline must be in the future.");
        }

        const dailyCount = await getDailyPostCount(authUser.uid);
        if (dailyCount >= 10) {
          throw new Error("You have reached the 10-post daily limit for assignments and tutor ads.");
        }

        const docRef = await withTimeout(
          createPost({
            ...assignmentForm,
            creatorId: authUser.uid,
            creatorName: profile?.name || "Student",
            creatorEmail: profile?.email || authUser.email,
          }),
          10000,
          "Post creation timed out. Check that Firestore is created, your rules allow signed-in writes, and your internet connection is working."
        );

        router.push(`/post/${docRef.id}`);
        return;
      }

      if (!tutorForm.title.trim() || !tutorForm.bio.trim() || !tutorForm.hourlyRate || !tutorForm.contactInfo.trim()) {
        throw new Error("Title, bio, hourly rate, and contact info are required.");
      }

      if (Number(tutorForm.hourlyRate) <= 0) {
        throw new Error("Hourly rate must be greater than 0.");
      }

      if (!hasExistingListing) {
        const dailyCount = await getDailyPostCount(authUser.uid);
        if (dailyCount >= 10) {
          throw new Error("You have reached the 10-post daily limit for assignments and tutor ads.");
        }
      }

      await upsertTutorListing(authUser.uid, {
        name: profile.name,
        email: profile.email,
        title: tutorForm.title.trim(),
        bio: tutorForm.bio.trim(),
        subjects: parseSubjects(tutorForm.subjects),
        gradeLevel: tutorForm.gradeLevel.trim(),
        hourlyRate: tutorForm.hourlyRate,
        availability: tutorForm.availability.trim(),
        contactInfo: tutorForm.contactInfo.trim(),
        preferredPaymentMethod: tutorForm.preferredPaymentMethod.trim(),
        active: tutorForm.active,
      });

      router.push("/tutors");
    } catch (submitError) {
      setError(submitError.message || "Unable to save your post.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTutorListing() {
    setError("");
    setSubmitting(true);

    try {
      await deleteTutorListing(authUser.uid);
      setHasExistingListing(false);
      setTutorForm({
        title: "",
        bio: "",
        subjects: "",
        gradeLevel: "",
        hourlyRate: "",
        availability: "",
        contactInfo: "",
        preferredPaymentMethod: "",
        active: true,
      });
      router.push("/tutors");
    } catch (submitError) {
      setError(submitError.message || "Unable to delete tutor listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div>
        <h1>Create a post</h1>
        <p className="helper-text">
          Switch between assignment ads and helper ads from one place. Each account can publish up to 10 total ads per day.
        </p>
      </div>

      {!profile && (
        <div className="card">
          <h2>Complete your profile first</h2>
          <p className="helper-text">
            Your sign-in worked, but your Firestore profile is missing. Finish setup before creating a post.
          </p>
          <Link href="/complete-profile" className="button">
            Complete profile
          </Link>
        </div>
      )}

      {profile && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="adType">Post type</label>
            <select
              id="adType"
              value={adType}
              onChange={(event) => setAdType(event.target.value)}
            >
              <option value={AD_TYPES.ASSIGNMENT}>Student ad</option>
              <option value={AD_TYPES.TUTOR}>Helper ad</option>
            </select>
          </div>

          {adType === AD_TYPES.ASSIGNMENT ? (
            <>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" value={assignmentForm.title} onChange={handleAssignmentChange} />
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  value={assignmentForm.description}
                  onChange={handleAssignmentChange}
                />
              </div>
              <div className="field">
                <label htmlFor="subject">Subject</label>
                <select id="subject" name="subject" value={assignmentForm.subject} onChange={handleAssignmentChange}>
                  {SUBJECT_OPTIONS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="assignment-grade-level">Grade level</label>
                <input
                  id="assignment-grade-level"
                  name="gradeLevel"
                  placeholder="9th grade, AP Calc AB, college freshman"
                  value={assignmentForm.gradeLevel}
                  onChange={handleAssignmentChange}
                />
              </div>
              <div className="field">
                <label htmlFor="priceOffered">Price offered ($)</label>
                <input
                  id="priceOffered"
                  name="priceOffered"
                  type="number"
                  min="1"
                  step="0.01"
                  value={assignmentForm.priceOffered}
                  onChange={handleAssignmentChange}
                />
              </div>
              <div className="field">
                <label htmlFor="deadline">Deadline (optional)</label>
                <input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  value={assignmentForm.deadline}
                  onChange={handleAssignmentChange}
                />
              </div>
              <div className="field">
                <label htmlFor="assignment-contact-info">Contact info</label>
                <input
                  id="assignment-contact-info"
                  name="contactInfo"
                  placeholder="Phone number, Instagram, Discord, or preferred contact"
                  value={assignmentForm.contactInfo}
                  onChange={handleAssignmentChange}
                />
              </div>
              <div className="field">
                <label htmlFor="assignment-payment-method">Preferred payment method</label>
                <input
                  id="assignment-payment-method"
                  name="preferredPaymentMethod"
                  placeholder="Venmo, Cash App, PayPal, cash"
                  value={assignmentForm.preferredPaymentMethod}
                  onChange={handleAssignmentChange}
                />
              </div>
            </>
          ) : (
            <>
              {loadingExisting && <p className="helper-text">Loading your current helper ad...</p>}
              <div className="field">
                <label htmlFor="tutor-title">Listing title</label>
                <input
                  id="tutor-title"
                  name="title"
                  placeholder="Calculus helper for quizzes and homework"
                  value={tutorForm.title}
                  onChange={handleTutorChange}
                />
              </div>
              <div className="field">
                <label htmlFor="tutor-bio">Bio</label>
                <textarea id="tutor-bio" name="bio" rows="5" value={tutorForm.bio} onChange={handleTutorChange} />
              </div>
              <div className="field">
                <label htmlFor="tutor-subjects">Subjects</label>
                <input
                  id="tutor-subjects"
                  name="subjects"
                  list="tutor-listing-subjects"
                  placeholder="Calculus, Physics, Algebra"
                  value={tutorForm.subjects}
                  onChange={handleTutorChange}
                />
                <datalist id="tutor-listing-subjects">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <option key={subject} value={subject} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label htmlFor="tutor-grade-level">Grade level</label>
                <input
                  id="tutor-grade-level"
                  name="gradeLevel"
                  placeholder="Middle school, AP classes, college chemistry"
                  value={tutorForm.gradeLevel}
                  onChange={handleTutorChange}
                />
              </div>
              <div className="field">
                <label htmlFor="hourlyRate">Hourly rate ($)</label>
                <input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="1"
                  step="0.01"
                  value={tutorForm.hourlyRate}
                  onChange={handleTutorChange}
                />
              </div>
              <div className="field">
                <label htmlFor="availability">Availability</label>
                <input
                  id="availability"
                  name="availability"
                  placeholder="Weeknights after 6 PM, weekends"
                  value={tutorForm.availability}
                  onChange={handleTutorChange}
                />
              </div>
              <div className="field">
                <label htmlFor="tutor-contact-info">Contact info</label>
                <input
                  id="tutor-contact-info"
                  name="contactInfo"
                  placeholder="Phone number, Instagram, Discord, or preferred contact"
                  value={tutorForm.contactInfo}
                  onChange={handleTutorChange}
                />
              </div>
              <div className="field">
                <label htmlFor="tutor-payment-method">Preferred payment method</label>
                <input
                  id="tutor-payment-method"
                  name="preferredPaymentMethod"
                  placeholder="Venmo, Cash App, PayPal, cash"
                  value={tutorForm.preferredPaymentMethod}
                  onChange={handleTutorChange}
                />
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="active"
                  checked={tutorForm.active}
                  onChange={handleTutorChange}
                />
                Keep this listing visible in Helper Finder
              </label>
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="actions-row">
            <button type="submit" className="button" disabled={submitting}>
              {submitting
                ? adType === AD_TYPES.ASSIGNMENT
                  ? "Creating..."
                  : "Saving..."
                : adType === AD_TYPES.ASSIGNMENT
                  ? "Create assignment ad"
                  : "Save helper ad"}
            </button>
            {adType === AD_TYPES.TUTOR && hasExistingListing && (
              <button
                type="button"
                className="button button-secondary"
                onClick={handleDeleteTutorListing}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete helper ad"}
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

export default function UnifiedPostPage() {
  return (
    <ProtectedRoute>
      <PostPageContent />
    </ProtectedRoute>
  );
}
