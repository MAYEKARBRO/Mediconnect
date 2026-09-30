# Supabase Integration & Local Setup Guide

Follow these steps to finish setting up the Supabase backend for your MediConnect application.

## 1. Supabase Project Setup

### Option A: Using Supabase Cloud (Easier)
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Create a new project.
3. Once the project is created, go to **Project Settings** > **API**.
4. Copy the `Project URL` and `anon public` Key.

### Option B: Using Supabase Locally (Advanced)
1. Install Supabase CLI: `npm install -g supabase`
2. Run `supabase init` in a separate folder (or root if you want to track it).
3. Run `supabase start`.
4. Copy the API URL and Anon Key from the terminal output.

## 2. Configure Environment Variables

1. Open `.env` file in the project root.
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Database Schema Setup

1. Go to the **SQL Editor** in your Supabase Dashboard (or standard SQL client for local).
2. Open the file `supabase_schema.sql` located in this project's root directory.
3. Copy its content and paste it into the SQL Editor.
4. Click **Run**.
   - This creates the `profiles` table.
   - Sets up Row Level Security (RLS) policies.
   - Creates a trigger to automatically create a profile when a user signs up.

## 4. Run the Application

1. Open a terminal in VS Code.
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open the Local URL (usually `http://localhost:5173`) in your browser.

## 5. Testing the Integration

1. Go to the Login page.
2. Toggle to "Sign Up".
3. Select a Role (Patient/Doctor/Admin).
4. Enter Name, Email, and Password.
5. Click **Sign Up**.
   - You should be redirected to the appropriate dashboard.
   - Check your Supabase Table editor; you should see a new entry in the `auth.users` table AND the `public.profiles` table.

## Notes
- The default `supabase_schema.sql` assumes standard email/password authentication is enabled in your Supabase Authentication settings.
- If email confirmation is enabled (default), users won't be able to log in until they click the link in their email. You can disable "Confirm email" in **Authentication** > **Providers** > **Email** for easier testing.
