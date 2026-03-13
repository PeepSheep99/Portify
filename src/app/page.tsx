export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          Portify
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          Spotify to YouTube Music
        </p>
      </main>
    </div>
  );
}
