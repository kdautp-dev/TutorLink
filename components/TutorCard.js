import Link from "next/link";
import { getDisplayUsername, renderStars } from "@/lib/utils";

export default function TutorCard({ listing }) {
  return (
    <article className="card post-card">
      <div className="post-card-top">
        <div>
          <span className={`status-badge ${listing.active ? "status-open" : "status-completed"}`}>
            {listing.active ? "available" : "inactive"}
          </span>
          <h3>{listing.title}</h3>
          <p className="rating-line">
            {renderStars(listing.rating)} {getDisplayUsername(listing.tutorProfile)}{" "}
            <span>{listing.reviewCount || 0} reviews</span>
          </p>
        </div>
        <strong>${Number(listing.hourlyRate || 0).toFixed(2)}/hr</strong>
      </div>

      <p>{listing.bio}</p>

      <div className="subject-list">
        {(listing.subjects || []).map((subject) => (
          <span key={subject} className="subject-pill">
            {subject}
          </span>
        ))}
      </div>

      <div className="post-meta">
        <span>{listing.availability || "Availability not listed"}</span>
        <span>{listing.contactInfo || "Contact not listed"}</span>
        <span>{listing.preferredPaymentMethod || "Payment method not listed"}</span>
      </div>

      <Link href={`/profile/${listing.tutorId}`} className="button">
        View profile
      </Link>
    </article>
  );
}
