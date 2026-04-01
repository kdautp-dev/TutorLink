import { formatDate } from "@/lib/utils";

export default function ReviewList({ reviews }) {
  if (!reviews.length) {
    return <p className="helper-text">No reviews yet.</p>;
  }

  return (
    <div className="stack">
      {reviews.map((review) => (
        <article key={review.id} className="card">
          <div className="review-header">
            <strong>{review.rating}/5</strong>
            <span>{formatDate(review.createdAt)}</span>
          </div>
          <p>{review.comment || "No comment provided."}</p>
        </article>
      ))}
    </div>
  );
}
