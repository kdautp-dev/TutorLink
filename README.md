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
│   └── ReviewList.js
├── lib/
│   ├── constants.js
│   ├── firebase.js
│   ├── firestore.js
│   └── utils.js
├── pages/
│   ├── _app.js
│   ├── create-post.js
│   ├── index.js
│   ├── login.js
│   ├── signup.js
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
- Homepage feed of open requests with subject and price filtering
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
7. Optional but recommended: deploy the included Firestore rules.

```bash
firebase deploy --only firestore:rules
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
3. Add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel Project Settings.
4. Deploy.

Vercel will detect Next.js automatically.

## Notes

- Reviews are stored in a Firestore subcollection at `users/{tutorId}/reviews`.
- Tutor rating and review count are updated when a student submits a review.
- The included Firestore rules are permissive enough for this MVP. For production, move sensitive aggregate updates into Cloud Functions or a trusted backend.
