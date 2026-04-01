import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import ReviewList from "@/components/ReviewList";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { getProfileRatings, getTutorReviews, submitProfileRating } from "@/lib/firestore";
import { clampRating } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [profileRatings, setProfileRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingForm, setRatingForm] = useState({ rating: "5", comment: "" });
  const [ratingError, setRatingError] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const hasRatedProfile = useMemo(() => {
    if (!authUser) return false;

    return profileRatings.some((rating) => rating.raterId === authUser.uid);
  }, [authUser, profileRatings]);

  useEffect(() => {
    if (!id || !isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    async function loadProfile() {
      setLoading(true);

      const profileSnap = await getDoc(doc(db, "users", id));

      if (!profileSnap.exists()) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile({ id: profileSnap.id, ...profileSnap.data() });
      const [assignmentReviews, accountRatings] = await Promise.all([
        getTutorReviews(id),
        getProfileRatings(id),
      ]);
      assignmentReviews.sort((a, b) => {
        const left = a.createdAt?.seconds || 0;
        const right = b.createdAt?.seconds || 0;
        return right - left;
      });
      accountRatings.sort((a, b) => {
        const left = a.createdAt?.seconds || 0;
        const right = b.createdAt?.seconds || 0;
        return right - left;
      });
      setReviews(assignmentReviews);
      setProfileRatings(accountRatings);
      setLoading(false);
    }

    loadProfile();
  }, [id]);

  if (loading) {
    return <p className="helper-text">Loading profile...</p>;
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="card">
        <h1>Firebase setup required</h1>
        <p className="helper-text">Add your Firebase env vars to load user profiles.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card">
        <h1>Profile not found</h1>
        <p className="helper-text">That user profile is unavailable.</p>
      </div>
    );
  }

  const canRateProfile = authUser && authUser.uid !== profile.id && !hasRatedProfile;

  async function handleProfileRatingSubmit(event) {
    event.preventDefault();
    setRatingError("");
    setSubmittingRating(true);

    try {
      const token = await auth.currentUser.getIdToken();

      await submitProfileRating({
        profileId: profile.id,
        rating: clampRating(ratingForm.rating),
        comment: ratingForm.comment.trim(),
        token,
      });

      const nextRatings = await getProfileRatings(profile.id);
      nextRatings.sort((a, b) => {
        const left = a.createdAt?.seconds || 0;
        const right = b.createdAt?.seconds || 0;
        return right - left;
      });
      setProfileRatings(nextRatings);
      const refreshedProfileSnap = await getDoc(doc(db, "users", profile.id));

      if (refreshedProfileSnap.exists()) {
        setProfile({ id: refreshedProfileSnap.id, ...refreshedProfileSnap.data() });
      }
      setRatingForm({ rating: "5", comment: "" });
    } catch (error) {
      setRatingError(error.message || "Unable to submit profile rating.");
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <section className="stack-lg">
      <article className="card profile-card">
        <h1>{profile.name}</h1>
        <div className="profile-stats">
          <div>
            <span className="label">Role</span>
            <p>{profile.role}</p>
          </div>
          <div>
            <span className="label">Average rating</span>
            <p>{profile.rating ? `${profile.rating}/5` : "No ratings yet"}</p>
          </div>
        </div>
        <div>
          <span className="label">Subjects</span>
          <div className="subject-list">
            {profile.subjects?.length ? (
              profile.subjects.map((subject) => (
                <span key={subject} className="subject-pill">
                  {subject}
                </span>
              ))
            ) : (
              <p className="helper-text">No subjects listed.</p>
            )}
          </div>
        </div>
        <div>
          <span className="label">Bio</span>
          <p>{profile.bio || "No bio yet."}</p>
        </div>
      </article>

      {canRateProfile && (
        <form className="card form-card" onSubmit={handleProfileRatingSubmit}>
          <h2>Leave a one-time profile rating</h2>
          <div className="field">
            <label htmlFor="profile-rating">Rating</label>
            <select
              id="profile-rating"
              value={ratingForm.rating}
              onChange={(event) =>
                setRatingForm((current) => ({ ...current, rating: event.target.value }))
              }
            >
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="profile-comment">Comment (optional)</label>
            <textarea
              id="profile-comment"
              rows="3"
              value={ratingForm.comment}
              onChange={(event) =>
                setRatingForm((current) => ({ ...current, comment: event.target.value }))
              }
            />
          </div>
          {ratingError && <p className="error-text">{ratingError}</p>}
          <button type="submit" className="button" disabled={submittingRating}>
            {submittingRating ? "Submitting..." : "Submit rating"}
          </button>
        </form>
      )}

      {authUser && authUser.uid !== profile.id && hasRatedProfile && (
        <div className="card">
          <p className="helper-text">You have already left your one-time rating for this profile.</p>
        </div>
      )}

      <section>
        <h2>Assignment reviews</h2>
        <ReviewList reviews={reviews} />
      </section>

      <section>
        <h2>Profile ratings</h2>
        <ReviewList reviews={profileRatings} />
      </section>
    </section>
  );
}
