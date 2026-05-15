import Link from "next/link";

export function LogRaceFab() {
  return (
    <Link
      href="/races/new"
      aria-label="Log race"
      className="md:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-accent text-white shadow-2xl flex items-center justify-center text-3xl font-bold active:scale-95 transition glow-accent"
    >
      +
    </Link>
  );
}
