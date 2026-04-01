import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getUserDirectory } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function PeoplePage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const directory = await getUserDirectory();
        setUsers(directory);
      } catch (loadError) {
        setError(loadError.message || "Unable to load account search.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      const haystack = [
        user.name,
        user.role,
        ...(user.subjects || []),
        user.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, users]);

  return (
    <section className="stack-lg">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Account search</p>
          <h1>Find people by name, subject, or bio</h1>
          <p className="helper-text">
            Search the school directory and open a profile to leave a one-time rating.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label htmlFor="account-search">Search accounts</label>
          <input
            id="account-search"
            placeholder="Search by name, subject, role, or bio"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading && <p className="helper-text">Loading accounts...</p>}
      {!loading && error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="post-grid">
          {filteredUsers.map((user) => (
            <article key={user.id} className="card post-card">
              <div className="post-card-top">
                <div>
                  <span className="status-badge status-open">{user.role || "member"}</span>
                  <h3>{user.name}</h3>
                </div>
                <strong>{user.rating ? `${user.rating}/5` : "New"}</strong>
              </div>
              <p>{user.bio || "No bio yet."}</p>
              <div className="subject-list">
                {(user.subjects || []).map((subject) => (
                  <span key={subject} className="subject-pill">
                    {subject}
                  </span>
                ))}
              </div>
              <Link href={`/profile/${user.id}`} className="button">
                View profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
