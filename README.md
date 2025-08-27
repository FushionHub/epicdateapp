# Super App - Social Media + Dating

This is a feature-rich "Super App" that combines the best of social media and dating applications. It is built on a modern, scalable tech stack designed for high performance and a rich user experience.

## Tech Stack

*   **Frontend:** [React](https://reactjs.org/)
*   **Backend & Database:** [Supabase](https://supabase.io/) (PostgreSQL, Edge Functions, Storage, Realtime)
*   **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **Push Notifications:** [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging)
*   **Payments:** [Paystack](https://paystack.com/)
*   **Face Verification:** [Amazon Rekognition](https://aws.amazon.com/rekognition/)

---

## Features Implemented

This application is packed with a huge number of advanced features:

### Core & Account
- **Secure Authentication:** Login with Email/Password, Google, or a passwordless Email Link (OTP).
- **Profile Management:** Users can create and update detailed profiles with photos, bios, and interests.
- **Advanced Security:** Includes Face Verification for profiles and a robust user blocking and reporting system.
- **Advanced Privacy:** Users can control their "last seen" status and who is allowed to message them.

### Social & Communication
- **Follow/Unfollow System:** A complete social graph allowing users to follow and be followed by others.
- **Real-time Chat:** A full-featured, 1-to-1 chat system for matched users.
- **Rich Media Messaging:** Supports sending text, images, videos, and audio messages.
- **Message Editing:** Users can edit their sent text messages.
- **Video Calling with Ringing:** A peer-to-peer WebRTC video calling system with a full "ringing" flow, including incoming call notifications and customizable ringtones.
- **User Timelines:** A "Facebook-style" timeline on each user's profile where they can create posts with text and images.

### Monetization
- **Wallet System:** Every user has a personal wallet to store funds.
- **Payment Integration:** Securely add funds to the wallet using Paystack.
- **Subscription Tiers:** The database supports different user subscription levels (e.g., Free, VIP, Pro).
- **Virtual Gifting:** Users can send virtual gifts to each other, paid for from their wallet balance.

### Notifications
- **Real-time Push Notifications:** Integrated with Firebase Cloud Messaging to send instant popup notifications for events like new messages.
- **Email Notification System:** The backend is equipped to send transactional emails via a custom SMTP server, with user-configurable settings.

---

## Project Documentation

This project includes a full suite of professional documentation in the `DOCUMENTATION/` directory, covering:
*   **`architecture.md`**: A detailed overview of the system architecture.
*   **`setup_guide.md`**: A comprehensive guide to setting up the development environment.
*   **`deployment_guide.md`**: Instructions for deploying the application to production.
*   **And more:** Guides for scaling, security, maintenance, and future development.

---

## Getting Started

For a comprehensive guide on setting up all required third-party services and running the project locally, please refer to **`DOCUMENTATION/setup_guide.md`**.

A brief overview of the local setup process is as follows:

1.  **Clone the repository.**
2.  **Set up accounts** for Supabase, Firebase, AWS (for Rekognition), and Paystack.
3.  **Run the database schema** from `DATABASE_SCHEMA.md` in your Supabase SQL Editor.
4.  **Configure Frontend:**
    *   Add your Firebase and Supabase public keys to `client/src/firebaseConfig.js` and `client/src/supabaseClient.js`.
5.  **Configure Backend Secrets:**
    *   In the Supabase Dashboard, add all the required secrets (API keys for Paystack, AWS, Firebase Admin, SMTP credentials, etc.) to each Edge Function.
6.  **Install & Run:**
    ```bash
    cd client
    npm install
    npm start
    ```

The application will be running at `http://localhost:3000`.
