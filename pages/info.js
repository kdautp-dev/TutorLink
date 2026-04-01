export default function InfoPage() {
  return (
    <section className="stack-lg">
      <div className="hero">
        <div>
          <p className="eyebrow">About Homework4Cash</p>
          <h1>How Homework4Cash works and how to reach us.</h1>
          <p className="hero-copy">
            Homework4Cash is a student-focused marketplace where people can post assignment help requests, advertise tutoring expertise, and connect directly.
          </p>
        </div>
      </div>

      <div className="info-grid">
        <article className="card stack">
          <h2>How It Works</h2>
          <p>
            Students or tutors can create assignment posts when they need help. Other users can click
            `I can help`, reveal contact information, and follow up directly to see whether tutoring is still needed.
          </p>
          <p>
            Users can also create tutor listings to advertise subjects, pricing, availability, and preferred contact method so others can discover them through Tutor Finder.
          </p>
        </article>

        <article className="card stack">
          <h2>Contact Us</h2>
          <p>
            Placeholder company email: <strong>support@homework4cash.example</strong>
          </p>
          <p>
            Placeholder phone line: <strong>(555) 123-4567</strong>
          </p>
          <p>
            Placeholder office hours: Monday to Friday, 9:00 AM to 5:00 PM local time.
          </p>
        </article>

        <article className="card stack">
          <h2>Trust & Safety</h2>
          <p>
            Always confirm pricing, payment method, and availability directly before starting work. Meet in safe locations or use school-approved communication methods when possible.
          </p>
          <p>
            This page currently contains placeholder company and support details that you can replace later with your real contact information and policies.
          </p>
        </article>

        <article className="card stack">
          <h2>What You Can Do Here</h2>
          <p>Post assignment help requests with contact and payment preferences.</p>
          <p>Browse tutor listings and bookmark people you want to revisit later.</p>
          <p>Rate profiles and build credibility through reviews and public ratings.</p>
        </article>
      </div>
    </section>
  );
}
