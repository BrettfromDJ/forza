"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  activateSeasonAction,
  completeSeasonAction,
  deleteSeasonAction,
  resetSeasonAction,
} from "@/lib/actions";

type Props = {
  seasonId: number;
  seasonName: string;
  status: string;
};

export function SeasonActionsMenu({ seasonId, seasonName, status }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Season actions"
        className="w-9 h-9 rounded-full border border-line hover:border-ink-dim flex items-center justify-center text-lg text-ink-dim hover:text-ink leading-none select-none"
      >
        ···
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 bg-surface border border-line/80 rounded-2xl shadow-2xl overflow-hidden py-1.5">
          <MenuLink href={`/seasons/${seasonId}/calendar`} onClick={close}>
            Calendar
          </MenuLink>
          <MenuLink href={`/seasons/${seasonId}/edit`} onClick={close}>
            Edit season
          </MenuLink>

          <Divider />

          {status !== "active" && (
            <form action={activateSeasonAction}>
              <input type="hidden" name="id" value={seasonId} />
              <MenuButton onClick={close}>Set active</MenuButton>
            </form>
          )}
          {status === "active" && (
            <form action={completeSeasonAction}>
              <input type="hidden" name="id" value={seasonId} />
              <MenuButton onClick={close}>Mark completed</MenuButton>
            </form>
          )}

          <Divider />

          <form
            action={resetSeasonAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  `Reset ${seasonName}? This deletes every race (and screenshots) in this season but keeps the season itself. This cannot be undone.`,
                )
              )
                e.preventDefault();
              else close();
            }}
          >
            <input type="hidden" name="id" value={seasonId} />
            <MenuButton className="text-accent-2">Reset stats</MenuButton>
          </form>

          <form
            action={deleteSeasonAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  `Delete ${seasonName}? This permanently removes the season and every race in it. This cannot be undone.`,
                )
              )
                e.preventDefault();
              else close();
            }}
          >
            <input type="hidden" name="id" value={seasonId} />
            <MenuButton className="text-bad">Delete season</MenuButton>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm hover:bg-surface-2 transition"
    >
      {children}
    </Link>
  );
}

function MenuButton({
  onClick,
  className = "",
  children,
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2 transition ${className}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-line/60 my-1.5" />;
}
