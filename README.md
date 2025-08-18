# Dating App (React + Firebase + Supabase)

This is the foundation for a modern dating application built with a powerful and scalable tech stack:

*   **Frontend:** [React](https://reactjs.org/)
*   **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth) (handles user sign-up, login, and OAuth)
*   **Database:** [Supabase](https://supabase.io/) (provides a PostgreSQL database and auto-generated APIs)

## Features Implemented

*   **User Authentication:** Secure sign-up and login with Email/Password and Google OAuth, managed by Firebase.
*   **Protected Routes:** Core application routes are protected, ensuring only logged-in users can access them.
*   **Database Integration:** The app is connected to a Supabase backend for data storage.
*   **Profile Management:** Authenticated users can create and update their profiles, which are stored in the Supabase database.

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   [Node.js](https://nodejs.org/en/) (v14 or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)

You will also need accounts for the following services:

*   [Firebase](https://firebase.google.com/)
*   [Supabase](https://supabase.io/)

---

## Getting Started

Follow these instructions carefully to get the project up and running on your local machine.

### 1. Set Up Firebase

**a. Create a Firebase Project:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Click "Add project" and follow the on-screen instructions.

**b. Register Your Web App:**
   - Inside your new project, click the Web icon (`</>`) to add a new web app.
   - Give your app a nickname and click "Register app".

**c. Get Your Firebase Config:**
   - After registering, Firebase will provide you with a `firebaseConfig` object. This contains your project's unique API keys and identifiers. **Copy this entire object.**

**d. Add Config to Your Project:**
   - Open the `client/src/firebaseConfig.js` file in this project.
   - **Replace the placeholder `firebaseConfig` object with the one you copied from the Firebase console.**

**e. Enable Authentication Methods:**
   - In the Firebase Console, go to "Authentication" (under the "Build" menu).
   - Go to the "Sign-in method" tab.
   - Enable the "Email/Password" and "Google" providers.

### 2. Set Up Supabase

**a. Create a Supabase Project:**
   - Go to the [Supabase Dashboard](https://app.supabase.io/).
   - Click "New project" and follow the instructions.

**b. Get Your Supabase Credentials:**
   - In your new project's dashboard, go to "Project Settings" (the gear icon in the sidebar).
   - Click on the "API" tab.
   - You will find your **Project URL** and your **`anon` public key**. You will need these.

**c. Add Credentials to Your Project:**
   - Open the `client/src/supabaseClient.js` file.
   - **Replace the placeholder `supabaseUrl` and `supabaseAnonKey` with the values you just copied.**

**d. Set Up the Database Schema:**
   - In the Supabase dashboard, go to the "SQL Editor" (the SQL icon in the sidebar).
   - Open the `DATABASE_SCHEMA.md` file from this project.
   - Copy the entire SQL code block from the file.
   - Paste the code into the Supabase SQL editor and click **"Run"**. This will create the `profiles` table and set up the necessary security policies.

### 3. Install and Run the Application

**a. Navigate to the client directory:**
```bash
cd client
```

**b. Install dependencies:**
```bash
npm install
```

**c. Run the frontend development server:**
```bash
npm start
```
The React development server will start, and it should automatically open the application in your web browser at `http://localhost:3000`. You can now sign up, log in, and create your profile!
