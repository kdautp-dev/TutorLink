import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { getBookmarks } from "@/lib/firestore";
import { formatDate, renderStars, sortBookmarks } from "@/lib/utils";

function BookmarksContent() {
  const { authUser } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("saved-newest");

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

  const filteredBookmarks = useMemo(() => {
    const visibleItems = bookmarks.filter((bookmark) => {
      if (view === "all") return true;
      return bookmark.bookmarkType === view;
    });

    return sortBookmarks(visibleItems, sort);
  }, [bookmarks, sort, view]);

  return (
    <section className="stack-lg">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Bookmarks</p>
          <h1>Saved assignments, tutors, and accounts</h1>
          <p className="helper-text">
            Keep track of promising assignments, tutor ads, and accounts you may want to revisit later.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="field">
          <label htmlFor="bookmark-view">Show</label>
          <select id="bookmark-view" value={view} onChange={(event) => setView(event.target.value)}>
            <option value="all">Everything</option>
            <option value="assignment">Assignments</option>
            <option value="tutor">Tutor ads</option>
            <option value="profile">Accounts</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="bookmark-sort">Sort by</label>
          <select id="bookmark-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="saved-newest">Newest saved</option>
            <option value="deadline-soon">Deadline soonest</option>
            <option value="price-high">Highest assignment pay</option>
            <option value="price-low">Lowest assignment pay</option>
            <option value="rate-high">Highest tutor rate</option>
            <option value="rate-low">Lowest tutor rate</option>
          </select>
        </div>
      </div>

      {loading && <p className="helper-text">Loading bookmarks...</p>}
      {!loading && error && <p className="error-text">{error}</p>}
      {!loading && !error && !filteredBookmarks.length && (
        <div className="card">
          <p>No bookmarks yet.</p>
        </div>
      )}

      <div className="post-grid">
        {filteredBookmarks.map((bookmark) => {
          if (bookmark.bookmarkType === "assignment") {
            return (
              <article key={bookmark.id} className="card post-card">
                <div className="post-card-top">
                  <div>
                    <span className="status-badge status-in-progress">assignment</span>
                    <h3>{bookmark.title}</h3>
                  </div>
                  <strong>${Number(bookmark.priceOffered || 0).toFixed(2)}</strong>
                </div>
                <p>{bookmark.description || "No description saved."}</p>
                <div className="post-meta">
                  <span>{bookmark.subject || "No subject"}</span>
                  <span>{bookmark.gradeLevel || "Any grade level"}</span>
                  <span>{bookmark.deadline ? `Due ${formatDate(bookmark.deadline)}` : "No deadline"}</span>
                </div>
                <Link href={`/post/${bookmark.entityId}`} className="button">
                  View assignment
                </Link>
              </article>
            );
          }

          if (bookmark.bookmarkType === "tutor") {
            return (
              <article key={bookmark.id} className="card post-card">
                <div className="post-card-top">
                  <div>
                    <span className="status-badge status-open">tutor ad</span>
                    <h3>{bookmark.title}</h3>
                    <p className="rating-line">
                      {renderStars(bookmark.rating)} <span>{bookmark.reviewCount || 0} reviews</span>
                    </p>
                  </div>
                  <strong>${Number(bookmark.hourlyRate || 0).toFixed(2)}/hr</strong>
                </div>
                <p>{bookmark.bio || "No bio saved."}</p>
                <div className="post-meta">
                  <span>{bookmark.gradeLevel || "Any grade level"}</span>
                  <span>{bookmark.availability || "Availability not listed"}</span>
                </div>
                <Link href={`/profile/${bookmark.tutorId}`} className="button">
                  View tutor
                </Link>
              </article>
            );
          }

          return (
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
              <Link href={`/profile/${bookmark.profileId || bookmark.entityId}`} className="button">
                View profile
              </Link>
            </article>
          );
        })}
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
