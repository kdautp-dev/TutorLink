import Link from "next/link";
import { formatDate, getDisplayUsername, renderStars } from "@/lib/utils";

export default function PostCard({ post, isBookmarked = false, onToggleBookmark, bookmarkBusy = false }) {
  return (
    <article className="card post-card">
      <div className="post-card-top">
        <div>
          <h3>{post.title}</h3>
          <p className="rating-line">
            {renderStars(post.creatorRating)} {getDisplayUsername(post.creatorProfile)}{" "}
            <span>{post.creatorReviewCount || 0} reviews</span>
          </p>
        </div>
        <div className="card-corner-actions">
          {onToggleBookmark && (
            <button
              type="button"
              className={`bookmark-button ${isBookmarked ? "bookmark-button-active" : ""}`}
              onClick={() => onToggleBookmark(post)}
              disabled={bookmarkBusy}
              aria-label={isBookmarked ? "Remove assignment bookmark" : "Save assignment bookmark"}
            >
              <svg viewBox="0 0 24 24" fill="none" className="bookmark-svg" aria-hidden="true">
                <path
                  d="M7 4.75h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.75a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <strong className="listing-price">${Number(post.priceOffered || 0).toFixed(2)}</strong>
        </div>
      </div>
      <p>{post.description}</p>
      <div className="post-meta">
        <span>{post.subject}</span>
        <span>{post.gradeLevel || "Any grade level"}</span>
        <span>{post.helperInterestCount || 0} people offered help</span>
        <span>{post.deadline ? `Due ${formatDate(post.deadline)}` : "No deadline"}</span>
        <span>Posted {formatDate(post.createdAt)}</span>
      </div>
      <Link href={`/post/${post.id}`} className="button">
        View details
      </Link>
    </article>
  );
}
