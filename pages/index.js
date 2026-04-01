import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import PostFilters from "@/components/PostFilters";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { POST_STATUSES } from "@/lib/constants";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const nextPosts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setPosts(nextPosts);
      setLoading(false);
    });

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
      <div className="hero">
        <div>
          <p className="eyebrow">Assignment help marketplace</p>
          <h1>Find a tutor for the exact assignment you need help with.</h1>
          <p className="hero-copy">
            TutorLink helps students post requests and lets tutors claim them fast.
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

      {!loading && !filteredPosts.length && (
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
