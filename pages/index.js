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
        <div className="card choice-card">
          <p className="eyebrow">Student path</p>
          <h2>I need help on an assignment</h2>
          <p>
            Choose whether you want to post your own assignment or browse tutors who are already advertising their expertise.
          </p>
          <div className="actions-row">
            <Link href="/create-post" className="button">
              Post assignment
            </Link>
            <Link href="/tutors" className="button button-secondary">
              Tutor finder
            </Link>
          </div>
        </div>

        <Link href="/assignments" className="card choice-card">
          <p className="eyebrow">Tutor path</p>
          <h2>I want to become a tutor</h2>
          <p>
            Browse live assignment requests and jump straight into helping people who need tutoring.
          </p>
          <span className="button">Go to assignments</span>
        </Link>
      </div>
    </section>
  );
}
