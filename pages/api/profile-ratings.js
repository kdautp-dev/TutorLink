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

  const { profileId, rating, comment } = request.body || {};

  if (!profileId) {
    return response.status(400).json({ error: "Profile is required." });
  }

  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return response.status(400).json({ error: "Rating must be an integer between 1 and 5." });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const raterId = decodedToken.uid;

    if (raterId === profileId) {
      throw new Error("You cannot rate your own profile.");
    }

    const userRef = adminDb.collection("users").doc(profileId);
    const ratingRef = userRef.collection("profileRatings").doc(raterId);

    await adminDb.runTransaction(async (transaction) => {
      const [userSnap, existingRatingSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(ratingRef),
      ]);

      if (!userSnap.exists) {
        throw new Error("Profile not found.");
      }

      if (existingRatingSnap.exists) {
        throw new Error("You have already rated this profile.");
      }

      const user = userSnap.data();
      const reviewCount = user.reviewCount || 0;
      const currentRating = user.rating || 0;
      const nextReviewCount = reviewCount + 1;
      const nextRating =
        (currentRating * reviewCount + numericRating) / nextReviewCount;

      transaction.set(ratingRef, {
        raterId,
        rating: numericRating,
        comment: comment?.trim() || "",
        createdAt: new Date(),
      });

      transaction.update(userRef, {
        rating: Number(nextRating.toFixed(2)),
        reviewCount: nextReviewCount,
      });
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(400).json({ error: error.message || "Unable to submit rating." });
  }
}
