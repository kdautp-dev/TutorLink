import Link from "next/link";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { getBookmarks } from "@/lib/firestore";
import { renderStars } from "@/lib/utils";

function BookmarksContent() {
  const { authUser } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookmarks() {
      if (!authUser) return;

      try {
        const nextBookmarks = await getBookmarks(authUser.uid);
        setBookmarks(nextBookmarks);
      } catch (loadError) {
        setError(loadError.message || "Unable to load bookmarks.");
      } finally {
        setLoading(false);
      }
    }

    loadBookmarks();
  }, [authUser]);

  return (
    <section className="stack-lg">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Bookmarks</p>
          <h1>Saved students and tutors</h1>
          <p className="helper-text">
            Keep track of people you may want to contact again or rate later.
          </p>
        </div>
      </div>

      {loading && <p className="helper-text">Loading bookmarks...</p>}
      {!loading && error && <p className="error-text">{error}</p>}
      {!loading && !error && !bookmarks.length && (
        <div className="card">
          <p>No bookmarks yet.</p>
        </div>
      )}

      <div className="post-grid">
        {bookmarks.map((bookmark) => (
          <article key={bookmark.id} className="card post-card">
            <div className="post-card-top">
              <div>
                <span className="status-badge status-open">{bookmark.role || "member"}</span>
                <h3>{bookmark.name}</h3>
              </div>
              <strong>{renderStars(bookmark.rating)}</strong>
            </div>
            <p>{bookmark.bio || "No bio yet."}</p>
            <div className="post-meta">
              <span>{bookmark.reviewCount || 0} reviews</span>
            </div>
            <div className="subject-list">
              {(bookmark.subjects || []).map((subject) => (
                <span key={subject} className="subject-pill">
                  {subject}
                </span>
              ))}
            </div>
            <Link href={`/profile/${bookmark.profileId}`} className="button">
              View profile
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BookmarksPage() {
  return (
    <ProtectedRoute>
      <BookmarksContent />
    </ProtectedRoute>
  );
}
