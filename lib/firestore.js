import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
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
      rating: profile.rating ?? 0,
      reviewCount: profile.reviewCount ?? 0,
      createdAt: profile.createdAt || serverTimestamp(),
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

export async function submitReview({ postId, tutorId, studentId, rating, comment }) {
  requireDb();
  const postRef = doc(db, "posts", postId);
  const tutorRef = doc(db, "users", tutorId);
  const reviewRef = doc(collection(db, "users", tutorId, "reviews"));

  await runTransaction(db, async (transaction) => {
    const [postSnap, tutorSnap] = await Promise.all([
      transaction.get(postRef),
      transaction.get(tutorRef),
    ]);

    if (!postSnap.exists()) {
      throw new Error("Post not found.");
    }

    if (!tutorSnap.exists()) {
      throw new Error("Tutor profile not found.");
    }

    const post = postSnap.data();
    const tutor = tutorSnap.data();

    if (post.creatorId !== studentId) {
      throw new Error("Only the student who created the post can leave a review.");
    }

    if (post.status !== POST_STATUSES.COMPLETED) {
      throw new Error("Reviews can only be left on completed posts.");
    }

    if (post.reviewSubmitted) {
      throw new Error("A review has already been submitted for this post.");
    }

    if (post.helperId !== tutorId) {
      throw new Error("This tutor is not assigned to the post.");
    }

    const reviewCount = tutor.reviewCount || 0;
    const currentRating = tutor.rating || 0;
    const nextReviewCount = reviewCount + 1;
    const nextRating =
      (currentRating * reviewCount + Number(rating)) / nextReviewCount;

    transaction.set(reviewRef, {
      postId,
      tutorId,
      studentId,
      rating: Number(rating),
      comment,
      createdAt: serverTimestamp(),
    });

    transaction.update(tutorRef, {
      rating: Number(nextRating.toFixed(2)),
      reviewCount: increment(1),
    });

    transaction.update(postRef, {
      reviewSubmitted: true,
    });
  });
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
