import Link from "next/link";

export default function HomePage() {
  return (
    <section className="stack-lg">
      <div className="hero">
        <div>
          <p className="eyebrow">Two-sided tutoring marketplace</p>
          <h1>Choose how you want to use TutorLink.</h1>
          <p className="hero-copy">
            Post assignment requests when you need help, or publish a tutor listing so students can find your expertise.
          </p>
        </div>
      </div>

      <div className="choice-grid">
        <Link href="/assignments" className="card choice-card">
          <p className="eyebrow">Student path</p>
          <h2>I need help on an assignment</h2>
          <p>
            Browse open homework requests, filter by subject and price, and create a post when you need support.
          </p>
          <span className="button">Go to assignments</span>
        </Link>

        <Link href="/tutors" className="card choice-card">
          <p className="eyebrow">Tutor path</p>
          <h2>I want to become a tutor</h2>
          <p>
            Create a tutor listing, showcase your subjects and hourly rate, and let students discover your profile.
          </p>
          <span className="button">Go to tutor finder</span>
        </Link>
      </div>
    </section>
  );
}
