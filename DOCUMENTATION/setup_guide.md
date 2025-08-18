# Setup & Installation Guide

This guide provides detailed instructions for setting up the development environment for the Super App.

## 1. Prerequisites

Ensure you have the following software installed on your local machine:

*   **Node.js:** (v16 or later recommended). You can download it from [nodejs.org](https://nodejs.org/).
*   **npm:** This is the Node Package Manager and comes with Node.js.
*   **Git:** For cloning the repository. You can get it from [git-scm.com](https://git-scm.com/).
*   **Supabase CLI:** For local development and deployment of Edge Functions. Installation instructions are available at [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli).

## 2. Cloning the Repository

First, clone the project repository to your local machine:

```bash
git clone <repository-url>
cd <project-directory>
```

## 3. Third-Party Service Setup

This project relies on several external services. You must create an account and a project for each of the following.

### 3.1. Supabase Project

1.  **Create Account:** Sign up at [supabase.com](https://supabase.com).
2.  **Create Project:** Create a new project. Choose a strong database password and save it securely.
3.  **Get API Credentials:**
    *   Navigate to your project's **Settings > API**.
    *   You will find your **Project URL** and your **`anon` public key**.
4.  **Run Database Schema:**
    *   Navigate to the **SQL Editor** in your project dashboard.
    *   Copy the entire content of the `DATABASE_SCHEMA.md` file from this repository.
    *   Paste the SQL into a new query and click **Run**. This will create all the necessary tables and functions.

### 3.2. Firebase Project

1.  **Create Account:** Sign up at [firebase.google.com](https://firebase.google.com).
2.  **Create Project:** Add a new project in the Firebase Console.
3.  **Register Web App:**
    *   Inside your project, click the Web icon (`</>`) to add a web app.
    *   After registering, Firebase will provide a `firebaseConfig` object. Copy this.
4.  **Enable Authentication:**
    *   In the Firebase Console, go to **Build > Authentication**.
    *   On the "Sign-in method" tab, enable **Email/Password** and **Google**.
5.  **Enable Cloud Messaging:**
    *   Go to **Project settings > Cloud Messaging**.
    *   Under "Web configuration", generate a **VAPID key**. Copy this key.

### 3.3. AWS Account (for Face Verification)

1.  **Create Account:** Sign up at [aws.amazon.com](https://aws.amazon.com).
2.  **Create IAM User:**
    *   In the AWS Management Console, go to the **IAM** service.
    *   Create a new user.
    *   Attach the `AmazonRekognitionFullAccess` policy to this user.
    *   Generate an **Access Key ID** and a **Secret Access Key**. Save these credentials securely.

### 3.4. Paystack Account (for Payments)

1.  **Create Account:** Sign up at [paystack.com](https://paystack.com).
2.  **Get API Keys:**
    *   In your Paystack dashboard, go to **Settings > API Keys & Webhooks**.
    *   You will find your **Secret Key**.

## 4. Environment Configuration

### 4.1. Frontend Client (`.env` file)

The React app does not require a `.env` file. Instead, you need to directly edit the configuration files with your credentials.

1.  **Firebase Config:**
    *   Open `client/src/firebaseConfig.js`.
    *   Replace the placeholder `firebaseConfig` object with the one from your Firebase project.
    *   Replace the placeholder `YOUR_VAPID_KEY_FROM_FIREBASE` with your VAPID key.
2.  **Supabase Config:**
    *   Open `client/src/supabaseClient.js`.
    *   Replace the placeholder `supabaseUrl` and `supabaseAnonKey` with the credentials from your Supabase project.

### 4.2. Supabase Edge Functions (Secrets)

You must set the API keys and other secrets for the Edge Functions securely in the Supabase dashboard. **Do not hardcode them.**

1.  Go to your Supabase project dashboard.
2.  Go to **Settings > Functions**.
3.  For each function (`verify-face`, `initialize-payment`, `verify-payment-webhook`, `send-fcm-notification`), click on it and go to the **Secrets** section.
4.  Add the following secrets:
    *   `PAYSTACK_SECRET_KEY`: Your Paystack secret key.
    *   `AWS_ACCESS_KEY_ID`: Your AWS IAM user's access key.
    *   `AWS_SECRET_ACCESS_KEY`: Your AWS IAM user's secret key.
    *   `FIREBASE_SERVICE_ACCOUNT_JSON`: The entire JSON content of your Firebase service account key file. (To get this, go to Firebase Settings > Service accounts > Generate new private key).
    *   `SUPABASE_SERVICE_ROLE_KEY`: Found in your Supabase API settings.
    *   `SITE_URL`: The URL of your deployed frontend (e.g., `http://localhost:3000` for development).

## 5. Installing Dependencies & Running the App

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm start
    ```

The application should now be running on `http://localhost:3000`.

To deploy the Edge Functions, you will need to use the Supabase CLI. See the `deployment_guide.md` for instructions.
