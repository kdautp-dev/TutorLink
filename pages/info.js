export default function InfoPage() {
  return (
    <section className="stack-lg">
      <div className="hero">
        <div>
          <p className="eyebrow">About Homework4Cash</p>
          <h1>How Homework4Cash works and how to reach us.</h1>
          <p className="hero-copy">
            Homework4Cash is a student-focused marketplace where people can post assignment help requests, advertise their expertise, and find a reliable helper.
          </p>
        </div>
      </div>

      <div className="info-grid">
        <article className="card stack">
          <h2>How It Works</h2>
          <p>
            Anyone can create assignment posts when they need help. Other users can click `I can help` to unlock the contact info they need to follow up with the student.
          </p>
          <p>
            Anyone can also create helper listings to advertise subjects, pricing, availability, and a preferred contact method so others can discover them.
          </p>
        </article>

        <article className="card stack">
          <h2>Contact Us</h2>
          <p>
            Placeholder company email: <strong>homework4cash@gmail.com</strong>
          </p>
          <p>
            Placeholder phone line: <strong>(346)-332-4992</strong>
          </p>
          <p>
            Placeholder office hours: We usually respond between 6 AM and 11 PM CST.
          </p>
        </article>

        <article className="card stack">
          <h2>Trust & Safety</h2>
          <p>
            Always review other users' Homework4Cash ratings before helping or agreeing to accept help. Stay alert for scams, and remember that users should be 13 or older to use Homework4Cash.
          </p>
          <p>
            Never share sensitive personal information such as your full name, school, or passwords. Homework4Cash is not responsible for liabilities created through off-platform arrangements.
          </p>
        </article>

        <article className="card stack">
          <h2>What You Can Do Here</h2>
          <p>Post assignment help requests with contact and payment preferences.</p>
          <p>Browse helper listings and bookmark posts you want to revisit later.</p>
          <p>Rate profiles and build credibility through reviews and public ratings.</p>
        </article>
      </div>
    </section>
  );
}
