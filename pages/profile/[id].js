import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import ReviewList from "@/components/ReviewList";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { SUBJECT_OPTIONS, USER_ROLES } from "@/lib/constants";
import {
  buildProfileBookmark,
  getBookmarks,
  getProfileRatings,
  getTutorReviews,
  submitProfileRating,
  toggleBookmark,
  upsertUserProfile,
} from "@/lib/firestore";
import { clampRating, getDisplayUsername, parseSubjects, renderStars } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { authUser, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [profileRatings, setProfileRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    role: USER_ROLES.STUDENT,
    subjects: "",
    bio: "",
  });
  const [editError, setEditError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rating: "5", comment: "" });
  const [ratingError, setRatingError] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const hasRatedProfile = useMemo(() => {
    if (!authUser) return false;

    return profileRatings.some((rating) => rating.raterId === authUser.uid);
  }, [authUser, profileRatings]);

  useEffect(() => {
    async function loadBookmarks() {
      if (!authUser || !profile) return;

      try {
        const bookmarks = await getBookmarks(authUser.uid);
        setIsBookmarked(bookmarks.some((bookmark) => bookmark.id === `profile_${profile.id}`));
      } catch {
        setIsBookmarked(false);
      }
    }

    loadBookmarks();
  }, [authUser, profile]);

  useEffect(() => {
    if (!profile) return;

    setEditForm({
      name: profile.name || "",
      role: profile.role || USER_ROLES.STUDENT,
      subjects: (profile.subjects || []).join(", "),
      bio: profile.bio || "",
    });
  }, [profile]);

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
  const isOwnProfile = authUser?.uid === profile.id;

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function handleBookmarkToggle() {
    if (!authUser || !profile) return;

    setBookmarkBusy(true);

    try {
      const nextState = await toggleBookmark({
        ownerId: authUser.uid,
        bookmark: buildProfileBookmark(profile),
      });
      setIsBookmarked(nextState);
    } finally {
      setBookmarkBusy(false);
    }
  }

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

  async function handleProfileSave(event) {
    event.preventDefault();
    setEditError("");

    if (!authUser) {
      setEditError("You must be logged in to edit your profile.");
      return;
    }

    if (!editForm.name.trim()) {
      setEditError("Name is required.");
      return;
    }

    setSavingProfile(true);

    try {
      await upsertUserProfile(authUser.uid, {
        name: editForm.name.trim(),
        email: authUser.email,
        role: editForm.role,
        subjects: parseSubjects(editForm.subjects),
        bio: editForm.bio.trim(),
      });

      const refreshedProfileSnap = await getDoc(doc(db, "users", profile.id));
      if (refreshedProfileSnap.exists()) {
        setProfile({ id: refreshedProfileSnap.id, ...refreshedProfileSnap.data() });
      }
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      setEditError(error.message || "Unable to save your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <section className="stack-lg">
      <article className="card profile-card">
        {!isEditing ? (
          <>
            <h1>{profile.name}</h1>
            <p className="helper-text">{getDisplayUsername(profile)}</p>
            <div className="profile-stats">
              <div>
                <span className="label">Role</span>
                <p>{profile.role}</p>
              </div>
              <div>
                <span className="label">Average rating</span>
                <p className="rating-line">
                  {renderStars(profile.rating)} {getDisplayUsername(profile)}{" "}
                  <span>{profile.reviewCount || 0} reviews</span>
                </p>
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
          </>
        ) : (
          <form className="stack" onSubmit={handleProfileSave}>
            <div className="field">
              <label htmlFor="edit-name">Name</label>
              <input id="edit-name" name="name" value={editForm.name} onChange={handleEditChange} />
            </div>
            <div className="field">
              <label htmlFor="edit-role">Role</label>
              <select id="edit-role" name="role" value={editForm.role} onChange={handleEditChange}>
                <option value={USER_ROLES.STUDENT}>Student</option>
                <option value={USER_ROLES.TUTOR}>Tutor</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-subjects">Subjects</label>
              <input
                id="edit-subjects"
                name="subjects"
                list="profile-subject-suggestions"
                placeholder="Calculus, Physics, English"
                value={editForm.subjects}
                onChange={handleEditChange}
              />
              <datalist id="profile-subject-suggestions">
                {SUBJECT_OPTIONS.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="edit-bio">Bio</label>
              <textarea id="edit-bio" name="bio" rows="4" value={editForm.bio} onChange={handleEditChange} />
            </div>
            {editError && <p className="error-text">{editError}</p>}
            <div className="actions-row">
              <button type="submit" className="button" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditError("");
                  setEditForm({
                    name: profile.name || "",
                    role: profile.role || USER_ROLES.STUDENT,
                    subjects: (profile.subjects || []).join(", "),
                    bio: profile.bio || "",
                  });
                }}
                disabled={savingProfile}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {isOwnProfile && !isEditing && (
          <button type="button" className="button" onClick={() => setIsEditing(true)}>
            Edit profile
          </button>
        )}
        {authUser && authUser.uid !== profile.id && (
          <button
            type="button"
            className="button"
            onClick={handleBookmarkToggle}
            disabled={bookmarkBusy}
          >
            {bookmarkBusy ? "Saving..." : isBookmarked ? "Remove bookmark" : "Bookmark profile"}
          </button>
        )}
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
