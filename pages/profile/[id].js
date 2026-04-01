import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import ReviewList from "@/components/ReviewList";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { getTutorReviews } from "@/lib/firestore";

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const tutorReviews = await getTutorReviews(id);
      tutorReviews.sort((a, b) => {
        const left = a.createdAt?.seconds || 0;
        const right = b.createdAt?.seconds || 0;
        return right - left;
      });
      setReviews(tutorReviews);
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

  return (
    <section className="stack-lg">
      <article className="card profile-card">
        <h1>{profile.name}</h1>
        <p className="helper-text">{profile.email}</p>
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

      <section>
        <h2>Reviews</h2>
        <ReviewList reviews={reviews} />
      </section>
    </section>
  );
}
