import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { POST_STATUSES, USER_ROLES } from "@/lib/constants";

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured. Add your NEXT_PUBLIC_FIREBASE_* variables.");
  }
}

export async function createUserProfile(uid, profile) {
  requireDb();
  const userRef = doc(db, "users", uid);

  await setDoc(userRef, {
    uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    subjects: profile.subjects || [],
    bio: profile.bio || "",
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function upsertUserProfile(uid, profile) {
  requireDb();
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      uid,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      subjects: profile.subjects || [],
      bio: profile.bio || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid) {
  requireDb();
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
}

export async function createPost(data) {
  requireDb();
  return addDoc(collection(db, "posts"), {
    title: data.title,
    description: data.description,
    subject: data.subject,
    priceOffered: Number(data.priceOffered),
    deadline: data.deadline || null,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    creatorEmail: data.creatorEmail,
    helperId: null,
    helperName: null,
    helperEmail: null,
    createdAt: serverTimestamp(),
    status: POST_STATUSES.OPEN,
    completedAt: null,
    reviewSubmitted: false,
  });
}

export async function upsertTutorListing(tutorId, data) {
  requireDb();
  const listingRef = doc(db, "tutorListings", tutorId);

  const existingSnap = await getDoc(listingRef);

  await setDoc(
    listingRef,
    {
      tutorId,
      name: data.name,
      email: data.email,
      title: data.title,
      bio: data.bio,
      subjects: data.subjects || [],
      hourlyRate: Number(data.hourlyRate),
      availability: data.availability || "",
      active: data.active ?? true,
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function claimPost(postId, tutorProfile) {
  requireDb();
  const postRef = doc(db, "posts", postId);

  await runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found.");
    }

    const post = postSnap.data();

    if (post.status !== POST_STATUSES.OPEN) {
      throw new Error("This post has already been claimed.");
    }

    if (tutorProfile.role !== USER_ROLES.TUTOR) {
      throw new Error("Only tutors can claim posts.");
    }

    transaction.update(postRef, {
      status: POST_STATUSES.IN_PROGRESS,
      helperId: tutorProfile.uid,
      helperName: tutorProfile.name,
      helperEmail: tutorProfile.email,
    });
  });
}

export async function markPostCompleted(postId, userId) {
  requireDb();
  const postRef = doc(db, "posts", postId);

  await runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found.");
    }

    const post = postSnap.data();

    if (post.creatorId !== userId) {
      throw new Error("Only the post creator can mark it as completed.");
    }

    transaction.update(postRef, {
      status: POST_STATUSES.COMPLETED,
      completedAt: serverTimestamp(),
    });
  });
}

export async function submitReview({ postId, tutorId, rating, comment, token }) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      postId,
      tutorId,
      rating: Number(rating),
      comment,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to submit review.");
  }

  return payload;
}

export async function reportPost({ postId, reporterId, reason }) {
  requireDb();
  await addDoc(collection(db, "reports"), {
    postId,
    reporterId,
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function getTutorReviews(tutorId) {
  requireDb();
  const reviewsRef = collection(db, "users", tutorId, "reviews");
  const reviewSnap = await getDocs(query(reviewsRef));

  return reviewSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getCompletedPostsForStudent(studentId) {
  requireDb();
  const postsRef = collection(db, "posts");
  const postsQuery = query(
    postsRef,
    where("creatorId", "==", studentId),
    where("status", "==", POST_STATUSES.COMPLETED)
  );
  const postsSnap = await getDocs(postsQuery);

  return postsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getTutorListing(tutorId) {
  requireDb();
  const listingRef = doc(db, "tutorListings", tutorId);
  const listingSnap = await getDoc(listingRef);

  return listingSnap.exists() ? { id: listingSnap.id, ...listingSnap.data() } : null;
}
