import { adminAuth, adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
function getBearerToken(request) {
  const header = request.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
    return response.status(500).json({
      error:
        "Firebase Admin is not configured on the server. Add the FIREBASE_ADMIN_* environment variables in Vercel.",
    });
  }

  const token = getBearerToken(request);

  if (!token) {
    return response.status(401).json({ error: "Missing authorization token." });
  }

  const { postId, tutorId, rating, comment } = request.body || {};

  if (!postId || !tutorId || !comment?.trim()) {
    return response.status(400).json({ error: "Post, tutor, and comment are required." });
  }

  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return response.status(400).json({ error: "Rating must be an integer between 1 and 5." });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const studentId = decodedToken.uid;
    const postRef = adminDb.collection("posts").doc(postId);
    const tutorRef = adminDb.collection("users").doc(tutorId);
    const reviewRef = tutorRef.collection("reviews").doc();

    await adminDb.runTransaction(async (transaction) => {
      const [postSnap, tutorSnap] = await Promise.all([
        transaction.get(postRef),
        transaction.get(tutorRef),
      ]);

      if (!postSnap.exists) {
        throw new Error("Post not found.");
      }

      if (!tutorSnap.exists) {
        throw new Error("Helper profile not found.");
      }

      const post = postSnap.data();
      const tutor = tutorSnap.data();

      if (post.creatorId !== studentId) {
        throw new Error("Only the person who created the post can leave a review.");
      }

      if (post.status !== "completed") {
        throw new Error("Reviews can only be left on completed posts.");
      }

      if (post.reviewSubmitted) {
        throw new Error("A review has already been submitted for this post.");
      }

      if (post.helperId !== tutorId) {
        throw new Error("This helper is not assigned to the post.");
      }

      const reviewCount = tutor.reviewCount || 0;
      const currentRating = tutor.rating || 0;
      const nextReviewCount = reviewCount + 1;
      const nextRating =
        (currentRating * reviewCount + numericRating) / nextReviewCount;

      transaction.set(reviewRef, {
        postId,
        tutorId,
        studentId,
        rating: numericRating,
        comment: comment.trim(),
        createdAt: new Date(),
      });

      transaction.update(tutorRef, {
        rating: Number(nextRating.toFixed(2)),
        reviewCount: nextReviewCount,
      });

      transaction.update(postRef, {
        reviewSubmitted: true,
      });
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(400).json({ error: error.message || "Unable to submit review." });
  }
}
