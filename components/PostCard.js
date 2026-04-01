import Link from "next/link";
import { formatDate, getDisplayUsername, renderStars } from "@/lib/utils";

export default function PostCard({ post }) {
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
        <strong>${Number(post.priceOffered || 0).toFixed(2)}</strong>
      </div>
      <p>{post.description}</p>
      <div className="post-meta">
        <span>{post.subject}</span>
        <span>{post.helperInterestCount || 0} people offered help</span>
        <span>Posted {formatDate(post.createdAt)}</span>
      </div>
      <Link href={`/post/${post.id}`} className="button">
        View details
      </Link>
    </article>
  );
}
