import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { createPost, getDailyPostCount } from "@/lib/firestore";
import { withTimeout } from "@/lib/utils";

function CreatePostContent() {
  const router = useRouter();
  const { authUser, profile } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: SUBJECT_OPTIONS[0],
    priceOffered: "",
    deadline: "",
    contactInfo: "",
    preferredPaymentMethod: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.priceOffered || !form.contactInfo.trim()) {
      setError("Title, description, price, and contact info are required.");
      return;
    }

    if (Number(form.priceOffered) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const dailyCount = await getDailyPostCount(authUser.uid);

      if (dailyCount >= 10) {
        throw new Error("You have reached the 10-post daily limit for assignments and tutor ads.");
      }

      const docRef = await withTimeout(
        createPost({
          ...form,
          creatorId: authUser.uid,
          creatorName: profile?.name || "Student",
          creatorEmail: profile?.email || authUser.email,
        }),
        10000,
        "Post creation timed out. Check that Firestore is created, your rules allow signed-in writes, and your internet connection is working."
      );

      router.push(`/post/${docRef.id}`);
    } catch (submitError) {
      setError(submitError.message || "Unable to create post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div>
        <h1>Create a tutoring request</h1>
        <p className="helper-text">Only logged-in users can post. Keep the assignment brief and clear.</p>
      </div>

      {!profile && (
        <div className="card">
          <h2>Complete your profile first</h2>
          <p className="helper-text">
            Your sign-in worked, but your Firestore profile is missing. Finish setup before creating a post.
          </p>
          <Link href="/complete-profile" className="button">
            Complete profile
          </Link>
        </div>
      )}

      {profile && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="6"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <select id="subject" name="subject" value={form.subject} onChange={handleChange}>
              {SUBJECT_OPTIONS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priceOffered">Price offered ($)</label>
            <input
              id="priceOffered"
              name="priceOffered"
              type="number"
              min="1"
              step="0.01"
              value={form.priceOffered}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="deadline">Deadline (optional)</label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="contactInfo">Contact info</label>
            <input
              id="contactInfo"
              name="contactInfo"
              placeholder="Phone number, Instagram, Discord, or preferred contact"
              value={form.contactInfo}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="preferredPaymentMethod">Preferred payment method</label>
            <input
              id="preferredPaymentMethod"
              name="preferredPaymentMethod"
              placeholder="Venmo, Cash App, PayPal, cash"
              value={form.preferredPaymentMethod}
              onChange={handleChange}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Creating..." : "Create post"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function CreatePostPage() {
  return (
    <ProtectedRoute>
      <CreatePostContent />
    </ProtectedRoute>
  );
}
