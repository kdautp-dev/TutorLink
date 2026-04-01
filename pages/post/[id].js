import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { POST_STATUSES } from "@/lib/constants";
import { claimPost, deletePost } from "@/lib/firestore";
import { formatDate } from "@/lib/utils";

function PostDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const { authUser, profile } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    if (!id || !isFirebaseConfigured || !db) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onSnapshot(doc(db, "posts", id), (snapshot) => {
      setPost(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      setLoading(false);
    });

    return unsubscribe;
  }, [id]);

  const canClaim = useMemo(() => {
    return (
      authUser &&
      post?.status === POST_STATUSES.OPEN &&
      post?.creatorId !== authUser.uid &&
      !(post?.interestedHelperIds || []).includes(authUser.uid)
    );
  }, [authUser, post]);

  const canDeletePost = authUser && post && post.creatorId === authUser.uid;
  const hasOfferedHelp = authUser && (post?.interestedHelperIds || []).includes(authUser.uid);

  const canSeeContact =
    post &&
    authUser &&
    (post.creatorId === authUser.uid ||
      (post.interestedHelperIds || []).includes(authUser.uid));

  async function handleClaim() {
    setBusyAction("claim");
    setActionError("");

    try {
      await claimPost(post.id, {
        uid: authUser.uid,
        name: profile?.name || authUser.email?.split("@")[0] || "Helper",
        email: profile?.email || authUser.email || "",
      });
    } catch (error) {
      setActionError(error.message || "Unable to claim this post.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDelete() {
    setBusyAction("delete");
    setActionError("");

    try {
      await deletePost(post.id, authUser.uid);
      router.push("/assignments");
    } catch (error) {
      setActionError(error.message || "Unable to delete this post.");
    } finally {
      setBusyAction("");
    }
  }

  if (loading) {
    return <p className="helper-text">Loading post...</p>;
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="card">
        <h1>Firebase setup required</h1>
        <p className="helper-text">Add your Firebase env vars to load post details.</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card">
        <h1>Post not found</h1>
        <p className="helper-text">This tutoring request does not exist anymore.</p>
      </div>
    );
  }

  return (
    <section className="stack-lg">
      <article className="card detail-card">
        <div className="detail-header">
          <div>
            <span className={`status-badge status-${post.status}`}>{post.status}</span>
            <h1>{post.title}</h1>
          </div>
          <strong>${Number(post.priceOffered || 0).toFixed(2)}</strong>
        </div>

        <p>{post.description}</p>

        <div className="detail-grid">
          <div>
            <span className="label">Subject</span>
            <p>{post.subject}</p>
          </div>
          <div>
            <span className="label">Posted</span>
            <p>{formatDate(post.createdAt)}</p>
          </div>
          <div>
            <span className="label">Deadline</span>
            <p>{post.deadline ? formatDate(post.deadline) : "No deadline"}</p>
          </div>
          <div>
            <span className="label">Helpers interested</span>
            <p>{post.helperInterestCount || 0}</p>
          </div>
          <div>
            <span className="label">Posted by</span>
            <p>
              <Link href={`/profile/${post.creatorId}`}>{post.creatorName || "User"}</Link>
            </p>
          </div>
        </div>

        {canSeeContact && (
          <div className="info-box">
            <strong>Contact info</strong>
            <p>{post.contactInfo || "No contact info provided"}</p>
            <p className="helper-text">
              Preferred payment: {post.preferredPaymentMethod || "Not specified"}
            </p>
          </div>
        )}

        {actionError && <p className="error-text">{actionError}</p>}

        <div className="actions-row">
          {canClaim && (
            <button type="button" className="button" onClick={handleClaim} disabled={busyAction === "claim"}>
              {busyAction === "claim" ? "Saving..." : "I can help"}
            </button>
          )}

          {hasOfferedHelp && (
            <button type="button" className="button button-secondary" disabled>
              You offered help
            </button>
          )}

          {canDeletePost && (
            <button
              type="button"
              className="button button-secondary"
              onClick={handleDelete}
              disabled={busyAction === "delete"}
            >
              {busyAction === "delete" ? "Deleting..." : "Delete post"}
            </button>
          )}
        </div>
      </article>

      {authUser && (
        <div className="card">
          <p className="helper-text">
            If you offered help, reach out directly using the contact info above to ask whether tutoring is still needed.
          </p>
        </div>
      )}
    </section>
  );
}

export default function PostDetailPage() {
  return <PostDetailContent />;
}
