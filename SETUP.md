# Reading Companion App - Setup Guide

This guide walks you through setting up and deploying the Reading Companion app to your iPhone and eventually the App Store.

---

## Overview

The app consists of:
- **Expo (React Native)** - Cross-platform mobile framework
- **Supabase** - Authentication (magic link) and PostgreSQL database
- **Claude API** - Powers the AI analysis

---

## Part 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name it `reading-companion`
4. Set a strong database password (save this!)
5. Choose a region close to you
6. Click "Create new project"

### 1.2 Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run"

You should see success messages. This creates all the tables, functions, and policies.

### 1.3 Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Under Email settings:
   - Enable "Confirm email" (optional for magic link)
   - Enable "Enable email confirmations"

### 1.4 Configure Magic Link Redirect

1. Go to **Authentication** → **URL Configuration**
2. Add this to **Redirect URLs**:
   ```
   readingcompanion://auth/callback
   ```
3. For development, also add:
   ```
   exp://localhost:8081/--/auth/callback
   ```

### 1.5 Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Part 2: Claude API Setup

### 2.1 Get Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Go to **API Keys**
4. Create a new key
5. Copy it (you won't see it again!)

### 2.2 Security Note

⚠️ **Important**: The current setup has the Claude API key in the client code. For production:

**Option A: Keep it simple (for personal use)**
- The key is in your compiled app, which is acceptable for personal use
- Don't share the app publicly

**Option B: Secure backend (for App Store)**
- Create a simple backend (Supabase Edge Functions work great)
- Move Claude API calls to the backend
- Client calls your backend, backend calls Claude

---

## Part 3: Configure the App

### 3.1 Update Supabase Config

Edit `src/lib/supabase.ts`:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';  // Your Project URL
const SUPABASE_ANON_KEY = 'eyJ...';  // Your anon key
```

### 3.2 Update Claude Config

Edit `src/lib/claude.ts`:

```typescript
const CLAUDE_API_KEY = 'sk-ant-...';  // Your Claude API key
```

### 3.3 Update App Identifiers

Edit `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.readingcompanion"
    },
    "android": {
      "package": "com.yourname.readingcompanion"
    }
  }
}
```

---

## Part 4: Install Dependencies & Run

### 4.1 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Xcode (for iOS simulator/building)
- Expo Go app on your iPhone (for testing)

### 4.2 Install Dependencies

```bash
cd reading-companion-app
npm install
```

### 4.3 Run Development Server

```bash
npx expo start
```

### 4.4 Test on Your iPhone

1. Install **Expo Go** from the App Store
2. Scan the QR code shown in terminal
3. The app opens on your phone!

---

## Part 5: Deploy to Your iPhone (TestFlight)

### 5.1 Prerequisites

- Apple Developer Account ($99/year) - [developer.apple.com](https://developer.apple.com)
- EAS CLI installed: `npm install -g eas-cli`

### 5.2 Configure EAS

```bash
eas login
eas build:configure
```

This creates `eas.json`. The defaults are fine.

### 5.3 Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: Reading Companion
   - Bundle ID: Select the one from your Apple Developer account
   - SKU: `reading-companion-1`

### 5.4 Build for iOS

```bash
eas build --platform ios --profile production
```

This takes 15-30 minutes. EAS handles code signing automatically.

### 5.5 Submit to TestFlight

```bash
eas submit --platform ios
```

Or upload manually:
1. Download the `.ipa` from the EAS build
2. Use Transporter app (Mac) to upload to App Store Connect

### 5.6 Test via TestFlight

1. In App Store Connect, go to your app → TestFlight
2. Add yourself as a tester
3. Install TestFlight app on your iPhone
4. Accept the invite and install the app

---

## Part 6: App Store Submission (When Ready)

### 6.1 Prepare Assets

You'll need:
- App icon (1024x1024 PNG, no transparency)
- Screenshots for various device sizes
- App description, keywords, etc.

### 6.2 App Privacy

In App Store Connect, fill out:
- Privacy Policy URL (required)
- Data collection declarations

For this app:
- Collects email (for account)
- Collects user content (reading data)
- Data linked to user

### 6.3 Submit for Review

1. In App Store Connect, fill out all metadata
2. Upload screenshots
3. Submit for review (usually 24-48 hours)

---

## File Structure

```
reading-companion-app/
├── App.tsx                 # Main entry point with navigation
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── src/
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client & types
│   │   ├── claude.ts       # Claude API calls
│   │   └── export.ts       # Anki & PDF export
│   ├── store/
│   │   └── useStore.ts     # Zustand global state
│   └── screens/
│       ├── AuthScreen.tsx        # Magic link login
│       ├── HomeScreen.tsx        # Today dashboard
│       ├── LibraryScreen.tsx     # Book management
│       ├── ReviewScreen.tsx      # Spaced repetition
│       ├── SettingsScreen.tsx    # User settings
│       ├── BookDetailScreen.tsx  # Book chapters
│       ├── ChapterScreen.tsx     # Chapter status
│       ├── PreReadScreen.tsx     # Input chapter text
│       ├── PreReadResultScreen.tsx   # Pre-read briefing
│       ├── PostReadScreen.tsx    # Post-read setup
│       └── PostReadResultScreen.tsx  # Results + cards
└── supabase/
    └── schema.sql          # Database schema
```

---

## Export Features

### Anki Export
- Exports as tab-separated text file
- Compatible with Anki desktop import
- Includes tags: book name, card type, difficulty
- File format: `BookTitle_anki_timestamp.txt`

### PDF Export
- Full study guide with:
  - Chapter summary
  - Core concepts table
  - Key claims
  - All flashcards (questions + answers)
- Clean, printable formatting

### Text Share
- Simple text format
- Easy to copy/paste or share via Messages, Notes, etc.

---

## Troubleshooting

### "Network request failed" on login
- Check Supabase URL is correct
- Check internet connection
- Verify redirect URL is configured in Supabase

### Magic link doesn't open app
- Verify `readingcompanion://auth/callback` is in Supabase redirect URLs
- Check `scheme` in app.json matches

### Claude API errors
- Verify API key is correct
- Check you have credits/quota
- Look at error message in console

### Build fails
- Run `npx expo doctor` to check for issues
- Clear cache: `npx expo start -c`
- Delete node_modules and reinstall

---

## Next Steps

1. **Backend for Claude** - Move API calls to Supabase Edge Functions
2. **Push notifications** - Remind users to review cards
3. **Widgets** - iOS widget showing due cards
4. **Apple Watch** - Quick card review on watch
5. **Syntopical features** - Cross-book concept linking

---

## Support

If you run into issues:
1. Check the Expo docs: [docs.expo.dev](https://docs.expo.dev)
2. Supabase docs: [supabase.com/docs](https://supabase.com/docs)
3. React Navigation docs: [reactnavigation.org](https://reactnavigation.org)
