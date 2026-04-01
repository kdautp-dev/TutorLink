import Link from "next/link";

export default function TutorCard({ listing }) {
  return (
    <article className="card post-card">
      <div className="post-card-top">
        <div>
          <span className={`status-badge ${listing.active ? "status-open" : "status-completed"}`}>
            {listing.active ? "available" : "inactive"}
          </span>
          <h3>{listing.title}</h3>
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
        <span>{listing.email}</span>
      </div>

      <Link href={`/profile/${listing.tutorId}`} className="button">
        View profile
      </Link>
    </article>
  );
}
