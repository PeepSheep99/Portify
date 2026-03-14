# Portify

Transfer your Spotify playlists to YouTube Music in minutes.

**[Try it live](https://portify-teal.vercel.app)**

## Features

- Upload your Spotify data export (JSON files)
- Connect to YouTube Music via Google OAuth
- Automatically match tracks and create playlists
- Real-time progress tracking
- Works on desktop and mobile

## How It Works

1. **Export your Spotify data** - Go to [Spotify Privacy Settings](https://www.spotify.com/account/privacy/) and request "Account data"
2. **Upload JSON files** - Drop your `Playlist*.json` or `YourLibrary.json` files
3. **Connect YouTube Music** - Sign in with your Google account
4. **Transfer** - Click transfer and watch your playlists migrate

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, Framer Motion
- **Backend**: Python FastAPI (serverless on Vercel)
- **APIs**: YouTube Data API, Google OAuth Device Flow

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

# Run development server
npm run dev
```

## Privacy

Your data stays in your browser. We don't store any playlists or tokens on our servers. See our [Privacy Policy](https://portify-teal.vercel.app/privacy).

## Author

Made with love by Navneet
