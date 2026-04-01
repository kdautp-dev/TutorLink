import {
  deleteDoc,
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
import { AD_TYPES, POST_STATUSES } from "@/lib/constants";
import { getBookmarkId } from "@/lib/utils";

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
    gradeLevel: data.gradeLevel || "",
    priceOffered: Number(data.priceOffered),
    deadline: data.deadline || null,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    creatorEmail: data.creatorEmail,
    contactInfo: data.contactInfo,
    preferredPaymentMethod: data.preferredPaymentMethod,
    helperId: null,
    helperName: null,
    helperEmail: null,
    interestedHelperIds: [],
    helperInterestCount: 0,
    createdAt: serverTimestamp(),
    status: POST_STATUSES.OPEN,
    completedAt: null,
    reviewSubmitted: false,
  });
}

function isFromToday(value) {
  if (!value) return false;

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export async function getDailyPostCount(userId) {
  requireDb();

  const [postsSnap, tutorListingsSnap] = await Promise.all([
    getDocs(query(collection(db, "posts"), where("creatorId", "==", userId))),
    getDocs(query(collection(db, "tutorListings"), where("tutorId", "==", userId))),
  ]);

  const assignmentCount = postsSnap.docs.filter((docSnap) =>
    isFromToday(docSnap.data().createdAt)
  ).length;

  const tutorListingCount = tutorListingsSnap.docs.filter((docSnap) =>
    isFromToday(docSnap.data().createdAt)
  ).length;

  return assignmentCount + tutorListingCount;
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
      gradeLevel: data.gradeLevel || "",
      hourlyRate: Number(data.hourlyRate),
      availability: data.availability || "",
      contactInfo: data.contactInfo || "",
      preferredPaymentMethod: data.preferredPaymentMethod || "",
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

    if ((post.interestedHelperIds || []).includes(tutorProfile.uid)) {
      throw new Error("You have already offered help on this assignment.");
    }

    const nextInterestedIds = [...(post.interestedHelperIds || []), tutorProfile.uid];

    transaction.update(postRef, {
      interestedHelperIds: nextInterestedIds,
      helperInterestCount: nextInterestedIds.length,
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

export async function deletePost(postId, userId) {
  requireDb();
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    throw new Error("Post not found.");
  }

  if (postSnap.data().creatorId !== userId) {
    throw new Error("Only the post creator can delete it.");
  }

  await deleteDoc(postRef);
}

export async function deleteTutorListing(tutorId) {
  requireDb();
  await deleteDoc(doc(db, "tutorListings", tutorId));
}

export async function getUserDirectory() {
  requireDb();
  const usersSnap = await getDocs(collection(db, "users"));

  return usersSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function submitProfileRating({ profileId, rating, comment, token }) {
  const response = await fetch("/api/profile-ratings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      profileId,
      rating: Number(rating),
      comment,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to submit profile rating.");
  }

  return payload;
}

export async function getProfileRatings(userId) {
  requireDb();
  const ratingsRef = collection(db, "users", userId, "profileRatings");
  const ratingsSnap = await getDocs(query(ratingsRef));

  return ratingsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getBookmarks(userId) {
  requireDb();
  const bookmarksRef = collection(db, "users", userId, "bookmarks");
  const bookmarksSnap = await getDocs(query(bookmarksRef));

  return bookmarksSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function toggleBookmark({ ownerId, bookmark }) {
  requireDb();
  const bookmarkRef = doc(
    db,
    "users",
    ownerId,
    "bookmarks",
    bookmark.id || getBookmarkId(bookmark.bookmarkType, bookmark.entityId)
  );
  const bookmarkSnap = await getDoc(bookmarkRef);

  if (bookmarkSnap.exists()) {
    await deleteDoc(bookmarkRef);
    return false;
  }

  await setDoc(bookmarkRef, {
    ...bookmark,
    createdAt: serverTimestamp(),
    savedAt: serverTimestamp(),
  });

  return true;
}

export function buildProfileBookmark(profile) {
  return {
    id: getBookmarkId("profile", profile.id),
    bookmarkType: "profile",
    entityId: profile.id,
    profileId: profile.id,
    name: profile.name,
    role: profile.role || "",
    subjects: profile.subjects || [],
    bio: profile.bio || "",
    rating: profile.rating || 0,
    reviewCount: profile.reviewCount || 0,
  };
}

export function buildAssignmentBookmark(post) {
  return {
    id: getBookmarkId(AD_TYPES.ASSIGNMENT, post.id),
    bookmarkType: AD_TYPES.ASSIGNMENT,
    entityId: post.id,
    title: post.title,
    description: post.description || "",
    subject: post.subject || "",
    gradeLevel: post.gradeLevel || "",
    priceOffered: Number(post.priceOffered || 0),
    deadline: post.deadline || null,
    helperInterestCount: post.helperInterestCount || 0,
    creatorId: post.creatorId,
    creatorName: post.creatorName || "Member",
    creatorRating: post.creatorRating || 0,
    creatorReviewCount: post.creatorReviewCount || 0,
  };
}

export function buildTutorBookmark(listing) {
  return {
    id: getBookmarkId(AD_TYPES.TUTOR, listing.tutorId),
    bookmarkType: AD_TYPES.TUTOR,
    entityId: listing.tutorId,
    tutorId: listing.tutorId,
    title: listing.title,
    bio: listing.bio || "",
    subjects: listing.subjects || [],
    gradeLevel: listing.gradeLevel || "",
    hourlyRate: Number(listing.hourlyRate || 0),
    availability: listing.availability || "",
    rating: listing.rating || 0,
    reviewCount: listing.reviewCount || 0,
    active: listing.active ?? true,
    tutorName: listing.name || listing.tutorProfile?.name || "Tutor",
  };
}
