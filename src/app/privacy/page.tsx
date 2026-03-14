import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: March 14, 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">What Portify Does</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Portify helps you transfer your playlists from Spotify to YouTube Music.
            You upload your Spotify data export (JSON files), connect your YouTube Music account,
            and we create the playlists for you.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Data We Access</h2>
          <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
            <li><strong>Spotify Data:</strong> Your uploaded JSON files containing playlist names and track information</li>
            <li><strong>YouTube Music:</strong> Permission to create playlists and add videos to them</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Data We Store</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            <strong>We do not store any of your data on our servers.</strong> Your Spotify files are processed
            in your browser. YouTube authentication tokens are stored only in your browser&apos;s local storage
            and are never sent to or stored on our servers.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We use Google&apos;s OAuth 2.0 for YouTube Music authentication. Please review{' '}
            <a href="https://policies.google.com/privacy" className="text-[var(--spotify-green)] hover:underline">
              Google&apos;s Privacy Policy
            </a>{' '}
            for information on how they handle your data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            You can revoke Portify&apos;s access to your YouTube account at any time through your{' '}
            <a href="https://myaccount.google.com/permissions" className="text-[var(--spotify-green)] hover:underline">
              Google Account permissions
            </a>.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For any privacy concerns, please contact the developer.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <Link href="/" className="text-[var(--spotify-green)] hover:underline">
            ← Back to Portify
          </Link>
        </div>
      </div>
    </div>
  );
}
