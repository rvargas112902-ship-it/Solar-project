# Dainty Goals

Dainty Goals is a romantic, lightweight mobile app for couples to create and complete daily and weekly goals together in real time.

## What is implemented

- Secure email/password sign-up and sign-in with Firebase Authentication.
- Couple pairing via invite code.
- Real-time shared goal sync between both partners using Firestore listeners.
- Daily goals and weekly goals.
- Add, edit, delete, complete, and progress tracking for goals.
- Creator and completer attribution on each goal.
- Daily streak counter for completed daily goals.
- Weekly summary with completed/unfinished counts.
- Daily reminder preferences with local notification scheduling.
- Soft pastel, minimal UI with hearts/checkmarks and subtle celebration animation.

## Project structure

- `mobile/` — Expo React Native app.

## Run locally

1. Open `mobile/.env.example` and copy it to `mobile/.env`.
2. Fill in Firebase web app credentials from your Firebase project.
3. Enable Firebase Authentication (Email/Password) and Firestore Database.
4. In terminal:
   - `cd mobile`
   - `npm install`
   - `npm run start`
5. Open the app with Expo Go on each phone and sign in with two accounts.

## Firestore data model

- `users/{uid}`
  - `displayName`, `email`, `coupleId`, `streakCount`, `lastDailyCompletionDate`
  - `reminderEnabled`, `reminderHour`, `reminderMinute`, `pushToken`
- `couples/{coupleId}`
  - `inviteCode`, `members`, `createdBy`
- `couples/{coupleId}/goals/{goalId}`
  - `title`, `notes`, `frequency` (`daily`/`weekly`)
  - `progressCurrent`, `progressTarget`, `completed`
  - `createdBy`, `completedBy`, `weekKey`

## Use it with $0 publishing costs

- **No paid store publishing required:** use Expo Go directly on both phones for free.
- **Backend free tier:** Firebase Spark plan is free for small couple usage.
- **Optional installs:** if you want private install builds later, EAS has a free tier, but Expo Go is enough to use the app together immediately.
