import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { POST_STATUSES, USER_ROLES } from "@/lib/constants";
import { claimPost, markPostCompleted, reportPost, submitReview } from "@/lib/firestore";
import { clampRating, formatDate } from "@/lib/utils";

function PostDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const { authUser, profile } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reportReason, setReportReason] = useState("");
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
      profile?.role === USER_ROLES.TUTOR &&
      post?.status === POST_STATUSES.OPEN &&
      post?.creatorId !== authUser.uid
    );
  }, [authUser, post, profile?.role]);

  const canMarkCompleted =
    authUser &&
    post &&
    post.creatorId === authUser.uid &&
    post.status === POST_STATUSES.IN_PROGRESS;

  const canReview =
    authUser &&
    post &&
    post.creatorId === authUser.uid &&
    post.status === POST_STATUSES.COMPLETED &&
    post.helperId &&
    !post.reviewSubmitted;

  const canSeeContact =
    post &&
    authUser &&
    (post.creatorId === authUser.uid || post.helperId === authUser.uid);

  async function handleClaim() {
    setBusyAction("claim");
    setActionError("");

    try {
      await claimPost(post.id, profile);
    } catch (error) {
      setActionError(error.message || "Unable to claim this post.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleComplete() {
    setBusyAction("complete");
    setActionError("");

    try {
      await markPostCompleted(post.id, authUser.uid);
    } catch (error) {
      setActionError(error.message || "Unable to complete this post.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();
    setActionError("");

    if (!reviewForm.comment.trim()) {
      setActionError("Review comment is required.");
      return;
    }

    setBusyAction("review");

    try {
      await submitReview({
        postId: post.id,
        tutorId: post.helperId,
        studentId: authUser.uid,
        rating: clampRating(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });

      setReviewForm({ rating: "5", comment: "" });
    } catch (error) {
      setActionError(error.message || "Unable to submit review.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleReport() {
    setActionError("");

    if (!reportReason.trim()) {
      setActionError("Please enter a reason before reporting the post.");
      return;
    }

    setBusyAction("report");

    try {
      await reportPost({
        postId: post.id,
        reporterId: authUser.uid,
        reason: reportReason.trim(),
      });
      setReportReason("");
    } catch (error) {
      setActionError(error.message || "Unable to submit report.");
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
            <span className="label">Student</span>
            <p>
              <Link href={`/profile/${post.creatorId}`}>{post.creatorName || "Student"}</Link>
            </p>
          </div>
        </div>

        {post.helperId && (
          <div className="info-box">
            <strong>Assigned tutor</strong>
            <p>
              <Link href={`/profile/${post.helperId}`}>{post.helperName || "Tutor"}</Link>
            </p>
          </div>
        )}

        {canSeeContact && (
          <div className="info-box">
            <strong>Student contact</strong>
            <p>{post.creatorEmail}</p>
          </div>
        )}

        {actionError && <p className="error-text">{actionError}</p>}

        <div className="actions-row">
          {canClaim && (
            <button type="button" className="button" onClick={handleClaim} disabled={busyAction === "claim"}>
              {busyAction === "claim" ? "Claiming..." : "I can help"}
            </button>
          )}

          {canMarkCompleted && (
            <button
              type="button"
              className="button"
              onClick={handleComplete}
              disabled={busyAction === "complete"}
            >
              {busyAction === "complete" ? "Saving..." : "Mark as completed"}
            </button>
          )}
        </div>
      </article>

      {canReview && (
        <form className="card form-card" onSubmit={handleReviewSubmit}>
          <h2>Leave a review for your tutor</h2>
          <div className="field">
            <label htmlFor="rating">Rating</label>
            <select
              id="rating"
              value={reviewForm.rating}
              onChange={(event) =>
                setReviewForm((current) => ({ ...current, rating: event.target.value }))
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
            <label htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              rows="4"
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((current) => ({ ...current, comment: event.target.value }))
              }
            />
          </div>
          <button type="submit" className="button" disabled={busyAction === "review"}>
            {busyAction === "review" ? "Submitting..." : "Submit review"}
          </button>
        </form>
      )}

      {authUser && (
        <div className="card form-card">
          <h2>Report post</h2>
          <div className="field">
            <label htmlFor="report-reason">Reason</label>
            <textarea
              id="report-reason"
              rows="3"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
            />
          </div>
          <button type="button" className="button button-secondary" onClick={handleReport}>
            {busyAction === "report" ? "Sending..." : "Report post"}
          </button>
        </div>
      )}
    </section>
  );
}

export default function PostDetailPage() {
  return <PostDetailContent />;
}
