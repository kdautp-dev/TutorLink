import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import PostFilters from "@/components/PostFilters";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { POST_STATUSES } from "@/lib/constants";
import { getUserProfile } from "@/lib/firestore";

export default function AssignmentsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [filters, setFilters] = useState({
    subject: "",
    maxPrice: "",
    sort: "newest",
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return undefined;
    }

    const postsQuery = query(
      collection(db, "posts"),
      where("status", "==", POST_STATUSES.OPEN),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const post = { id: docSnap.id, ...docSnap.data() };
            const creatorProfile = await getUserProfile(post.creatorId);

            return {
              ...post,
              creatorProfile,
              creatorRating: creatorProfile?.rating || 0,
              creatorReviewCount: creatorProfile?.reviewCount || 0,
            };
          })
        )
          .then((nextPosts) => {
            setFeedError("");
            setPosts(nextPosts);
            setLoading(false);
          })
          .catch((error) => {
            setFeedError(error.message || "Unable to load assignments.");
            setLoading(false);
          });
      },
      (error) => {
        setFeedError(
          error.message ||
            "Unable to load assignments. Firestore may need an index or updated rules."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredPosts = useMemo(() => {
    const maxPrice = Number(filters.maxPrice);
    const nextPosts = posts.filter((post) => {
      const matchesSubject = !filters.subject || post.subject === filters.subject;
      const matchesPrice = !filters.maxPrice || Number(post.priceOffered) <= maxPrice;

      return matchesSubject && matchesPrice;
    });

    if (filters.sort === "price-low") {
      return [...nextPosts].sort((a, b) => Number(a.priceOffered) - Number(b.priceOffered));
    }

    if (filters.sort === "price-high") {
      return [...nextPosts].sort((a, b) => Number(b.priceOffered) - Number(a.priceOffered));
    }

    return nextPosts;
  }, [filters.maxPrice, filters.sort, filters.subject, posts]);

  function handleFilterChange(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <section className="stack-lg">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Assignments marketplace</p>
          <h1>Open requests from students</h1>
          <p className="helper-text">
            Tutors can browse open assignments, and students can compare current requests by subject and budget.
          </p>
        </div>
      </div>

      <PostFilters filters={filters} onChange={handleFilterChange} />

      {!isFirebaseConfigured && (
        <div className="card">
          <p>Connect Firebase to load live tutoring requests.</p>
        </div>
      )}

      {loading && <p className="helper-text">Loading open posts...</p>}

      {!loading && feedError && (
        <div className="card">
          <p className="error-text">{feedError}</p>
        </div>
      )}

      {!loading && !feedError && !filteredPosts.length && (
        <div className="card">
          <p>No open posts match your filters yet.</p>
        </div>
      )}

      <div className="post-grid">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
