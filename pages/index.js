import Link from "next/link";

export default function HomePage() {
  return (
    <section className="stack-lg">
      <div className="hero">
        <div>
          <p className="eyebrow">The best homework marketplace</p>
          <h1>Choose how you want to use Homework4Cash.</h1>
          <p className="hero-copy">
            Browse assignment offers or advertise your availability to help.
          </p>
        </div>
      </div>

      <div className="choice-grid">
        <div className="card choice-card">
          <p className="eyebrow">Student path</p>
          <h2>I need help on an assignment</h2>
          <p>
            Choose whether you want to post your own assignment or browse available helpers.
          </p>
          <div className="actions-row">
            <Link href="/post?type=assignment" className="button">
              Post Assignment
            </Link>
            <Link href="/tutors" className="button button-secondary">
              Find Helper
            </Link>
          </div>
        </div>

        <div className="card choice-card">
          <p className="eyebrow">Helper path</p>
          <h2>I want to help</h2>
          <p>
            Browse open assignments to earn money, or post your own helper listing so people can contact you directly.
          </p>
          <div className="actions-row">
            <Link href="/assignments" className="button">
              Browse Assignments
            </Link>
            <Link href="/post?type=tutor" className="button button-secondary">
              Post Helper Ad
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
