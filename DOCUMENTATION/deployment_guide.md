# Deployment Guide

This guide provides step-by-step instructions for deploying the Super App to a production environment.

## 1. Deploying the Frontend (React App)

The recommended platform for deploying modern React applications is **Vercel**, but other platforms like Netlify or AWS Amplify are also excellent choices.

### Using Vercel (Recommended)

1.  **Push to Git Repository:** Ensure your entire project is pushed to a GitHub, GitLab, or Bitbucket repository.
2.  **Sign Up for Vercel:** Create an account at [vercel.com](https://vercel.com) and connect it to your Git provider.
3.  **Import Project:**
    *   From your Vercel dashboard, click "Add New... > Project".
    *   Select the Git repository for this project.
4.  **Configure Project:**
    *   Vercel will automatically detect that it's a React app.
    *   **Root Directory:** Set the root directory to `client`. This is crucial because our React app is inside the `client` folder.
    *   **Build & Output Settings:** Vercel's defaults for Create React App are usually correct (`npm run build`, output directory `build`).
    *   **Environment Variables:** You do not need to set environment variables here, as all keys are intended to be public and are part of the committed code in `firebaseConfig.js` and `supabaseClient.js`.
5.  **Deploy:** Click the "Deploy" button. Vercel will build and deploy your application. After deployment, it will provide you with a public URL.
6.  **Update `SITE_URL`:** Go back to your Supabase dashboard (**Settings > Functions**) and update the `SITE_URL` secret to your new Vercel production URL. This is important for features like the Paystack callback.

## 2. Deploying Supabase Edge Functions

You must use the Supabase CLI to deploy your Edge Functions.

### 2.1. Initial Setup

1.  **Install Supabase CLI:** If you haven't already, install the CLI.
    ```bash
    npm install supabase --save-dev
    ```
2.  **Log In:**
    ```bash
    npx supabase login
    ```
3.  **Link Project:** In the root directory of your project, link your local project to your remote Supabase project. You will need your Project ID from your Supabase dashboard URL (`https://app.supabase.io/project/<project-id>`).
    ```bash
    npx supabase link --project-ref <your-project-id>
    ```

### 2.2. Deploying a Function

1.  **Deploy the function:** To deploy a specific function (e.g., `verify-face`), run the following command:
    ```bash
    npx supabase functions deploy verify-face
    ```
2.  **Deploy All Functions:** To deploy all functions in your `supabase/functions` directory at once, you can run:
    ```bash
    npx supabase functions deploy
    ```
    It's often better to deploy functions individually to avoid unintended changes.

3.  **Set Secrets:** **This is a critical step.** For each deployed function, you must set the required secrets in the Supabase dashboard.
    *   Go to **Settings > Functions**.
    *   Click on the function you deployed.
    *   Go to the **Secrets** section and add the required keys (e.g., `PAYSTACK_SECRET_KEY`, `AWS_ACCESS_KEY_ID`, etc.) as documented in `setup_guide.md`.

## 3. Production Checklist

*   **[ ] Database Backups:** In your Supabase dashboard (**Project Settings > Database**), configure daily backups.
*   **[ ] Paystack Webhooks:** In your Paystack dashboard, go to **Settings > API Keys & Webhooks**. Add a webhook URL pointing to your `verify-payment-webhook` Edge Function. The URL will look like: `https://<your-project-ref>.supabase.co/functions/v1/verify-payment-webhook`.
*   **[ ] Custom Domain:** Configure a custom domain for both your Vercel frontend and your Supabase project for a professional look.
*   **[ ] Enable SSL:** Vercel and Supabase provide SSL automatically. Ensure it's active.
*   **[ ] Review RLS Policies:** Double-check that all your Row Level Security policies in Supabase are correct and restrictive enough for a production environment.
*   **[ ] Monitor Logs:** Regularly check the logs for your Vercel deployment and your Supabase Edge Functions to catch any errors.
