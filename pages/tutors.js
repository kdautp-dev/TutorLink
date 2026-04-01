import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import TutorCard from "@/components/TutorCard";
import TutorFilters from "@/components/TutorFilters";
import { useAuth } from "@/components/AuthProvider";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  buildTutorBookmark,
  getBookmarks,
  getUserProfile,
  toggleBookmark,
} from "@/lib/firestore";
import { getBookmarkId } from "@/lib/utils";

export default function TutorsPage() {
  const { authUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());
  const [bookmarkBusyId, setBookmarkBusyId] = useState("");
  const [filters, setFilters] = useState({
    subject: "",
    maxRate: "",
    sort: "newest",
  });

  useEffect(() => {
    async function loadBookmarks() {
      if (!authUser) {
        setSavedIds(new Set());
        return;
      }

      const bookmarks = await getBookmarks(authUser.uid);
      setSavedIds(new Set(bookmarks.map((bookmark) => bookmark.id)));
    }

    loadBookmarks().catch(() => setSavedIds(new Set()));
  }, [authUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return undefined;
    }

    const listingsQuery = query(
      collection(db, "tutorListings"),
      where("active", "==", true),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      listingsQuery,
      (snapshot) => {
        Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const listing = { id: docSnap.id, ...docSnap.data() };
            const tutorProfile = await getUserProfile(listing.tutorId);

            return {
              ...listing,
              tutorProfile,
              rating: tutorProfile?.rating || 0,
              reviewCount: tutorProfile?.reviewCount || 0,
            };
          })
        )
          .then((nextListings) => {
            setFeedError("");
            setListings(nextListings);
            setLoading(false);
          })
          .catch((error) => {
            setFeedError(error.message || "Unable to load tutor listings.");
            setLoading(false);
          });
      },
      (error) => {
        setFeedError(
          error.message ||
            "Unable to load tutor listings. Firestore may need an index or updated rules."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredListings = useMemo(() => {
    const maxRate = Number(filters.maxRate);
    const nextListings = listings.filter((listing) => {
      const matchesSubject =
        !filters.subject || (listing.subjects || []).includes(filters.subject);
      const matchesRate =
        !filters.maxRate || Number(listing.hourlyRate) <= maxRate;

      return matchesSubject && matchesRate;
    });

    if (filters.sort === "rate-low") {
      return [...nextListings].sort((a, b) => Number(a.hourlyRate) - Number(b.hourlyRate));
    }

    if (filters.sort === "rate-high") {
      return [...nextListings].sort((a, b) => Number(b.hourlyRate) - Number(a.hourlyRate));
    }

    return nextListings;
  }, [filters.maxRate, filters.sort, filters.subject, listings]);

  function handleFilterChange(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleToggleBookmark(listing) {
    if (!authUser) return;

    const bookmarkId = getBookmarkId("tutor", listing.tutorId);
    setBookmarkBusyId(bookmarkId);

    try {
      const nextState = await toggleBookmark({
        ownerId: authUser.uid,
        bookmark: buildTutorBookmark(listing),
      });

      setSavedIds((current) => {
        const next = new Set(current);
        if (nextState) {
          next.add(bookmarkId);
        } else {
          next.delete(bookmarkId);
        }
        return next;
      });
    } finally {
      setBookmarkBusyId("");
    }
  }

  return (
    <section className="stack-lg">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Tutor finder</p>
          <h1>Discover tutors advertising their expertise</h1>
          <p className="helper-text">
            Tutors can publish an active listing with subjects, availability, and hourly rate so students can reach out directly.
          </p>
        </div>
      </div>

      <TutorFilters filters={filters} onChange={handleFilterChange} />

      {loading && <p className="helper-text">Loading tutor listings...</p>}

      {!loading && feedError && (
        <div className="card">
          <p className="error-text">{feedError}</p>
        </div>
      )}

      {!loading && !feedError && !filteredListings.length && (
        <div className="card">
          <p>No tutor listings match your filters yet.</p>
        </div>
      )}

      <div className="post-grid">
        {filteredListings.map((listing) => (
          <TutorCard
            key={listing.id}
            listing={listing}
            isBookmarked={savedIds.has(getBookmarkId("tutor", listing.tutorId))}
            onToggleBookmark={authUser ? handleToggleBookmark : undefined}
            bookmarkBusy={bookmarkBusyId === getBookmarkId("tutor", listing.tutorId)}
          />
        ))}
      </div>
    </section>
  );
}
