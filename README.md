# TutorLink

TutorLink is a full-stack MVP that connects students with tutors for assignment-specific help. The frontend is built with Next.js, authentication and data storage use Firebase Authentication + Firestore, and the project is ready to deploy on Vercel.

## Project Structure

```text
TutorLink/
├── components/
│   ├── AuthProvider.js
│   ├── Layout.js
│   ├── PostCard.js
│   ├── PostFilters.js
│   ├── ProtectedRoute.js
│   ├── ReviewList.js
│   ├── TutorCard.js
│   └── TutorFilters.js
├── lib/
│   ├── constants.js
│   ├── firebaseAdmin.js
│   ├── firebase.js
│   ├── firestore.js
│   └── utils.js
├── pages/
│   ├── _app.js
│   ├── assignments.js
│   ├── create-post.js
│   ├── create-tutor-listing.js
 │   ├── index.js
 │   ├── login.js
 │   ├── signup.js
│   ├── tutors.js
│   ├── api/
│   │   └── reviews.js
│   ├── post/
│   │   └── [id].js
│   └── profile/
│       └── [id].js
├── styles/
│   └── globals.css
├── .env.local.example
├── firebase.json
├── firestore.rules
├── jsconfig.json
├── next.config.mjs
└── package.json
```

## Features Included

- Email/password sign up and login with Firebase Auth
- Firestore user profiles with role, subjects, bio, rating, and review count
- Student post creation with validation
- Dedicated assignments marketplace with subject and price filtering
- Tutor finder directory with tutor-created listings
- Tutor claim flow that marks posts as `in-progress`
- Post completion flow controlled by the post creator
- Tutor profile pages with average rating and reviews
- Review submission after a job is completed
- Report Post flow stored in Firestore

## Firebase Setup

1. Create a Firebase project in the Firebase Console.
2. Add a Web App to the project.
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Create a Firestore database in production or test mode.
5. Copy `.env.local.example` to `.env.local`.
6. Fill in your Firebase web app config values in `.env.local`.
7. Create a Firebase service account for secure server-side review writes:
   - Firebase Console > Project settings > Service accounts
   - Generate a new private key
   - Add these values to `.env.local` for local use and to Vercel for production:
     - `FIREBASE_ADMIN_PROJECT_ID`
     - `FIREBASE_ADMIN_CLIENT_EMAIL`
     - `FIREBASE_ADMIN_PRIVATE_KEY`
8. Deploy the included Firestore rules and indexes.

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying To Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add both the `NEXT_PUBLIC_FIREBASE_*` variables and the `FIREBASE_ADMIN_*` variables in Vercel Project Settings.
4. Deploy.

Vercel will detect Next.js automatically.

## Notes

- Reviews are stored in a Firestore subcollection at `users/{tutorId}/reviews`.
- Tutor rating and review count are updated server-side through a Next.js API route using Firebase Admin.
- Firestore rules now restrict profile edits, post creation, claim/completion actions, and block client-side review writes.
