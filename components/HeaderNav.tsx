"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { logoutAction } from "@/lib/actions";

type Props = {
  me: Player;
  activeSeasonId: number | null;
};

export function HeaderNav({ me, activeSeasonId }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex items-center gap-1 text-sm">
        <DesktopLink href={activeSeasonId ? `/seasons/${activeSeasonId}` : "/"}>Home</DesktopLink>
        <DesktopLink href="/seasons">Seasons</DesktopLink>
        <DesktopLink href="/teams">Teams</DesktopLink>
        <Link
          href={`/players/${me.id}`}
          className="px-3 py-2 rounded-md hover:bg-surface-2 text-ink flex items-center gap-2"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: me.color }}
          />
          <span className="font-semibold">{me.name}</span>
        </Link>
        <form action={logoutAction}>
          <button className="px-3 py-2 rounded-md text-ink-mute hover:text-ink">
            Log out
          </button>
        </form>
        {activeSeasonId && (
          <Link
            href="/races/new"
            className="ml-2 inline-flex items-center gap-2 bg-accent hover:brightness-110 transition px-4 py-2 rounded-full font-semibold text-sm text-white"
          >
            <span className="text-lg leading-none">+</span> Log race
          </Link>
        )}
      </nav>

      {/* Mobile */}
      <div className="flex md:hidden items-center">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 rounded-full hover:bg-surface-2 flex flex-col items-center justify-center gap-1.5"
        >
          <span className="block w-5 h-0.5 bg-ink rounded" />
          <span className="block w-5 h-0.5 bg-ink rounded" />
          <span className="block w-5 h-0.5 bg-ink rounded" />
        </button>
      </div>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] md:hidden"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-surface border-l border-line shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-line/60">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: me.color }}
                />
                <div>
                  <div className="font-bold text-sm">{me.name}</div>
                  <div className="text-[10px] text-ink-mute uppercase tracking-wider">
                    Driving as
                  </div>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close menu"
                className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center text-xl text-ink-dim"
              >
                ×
              </button>
            </div>

            <nav className="flex flex-col p-2 gap-1">
              <SheetLink href={activeSeasonId ? `/seasons/${activeSeasonId}` : "/"} onClick={close}>
                Home
              </SheetLink>
              <SheetLink href="/seasons" onClick={close}>
                Seasons
              </SheetLink>
              <SheetLink href="/teams" onClick={close}>
                Teams
              </SheetLink>
              <SheetLink href={`/players/${me.id}`} onClick={close}>
                My stats
              </SheetLink>
              {activeSeasonId && (
                <SheetLink href="/races/new" onClick={close}>
                  + Log race
                </SheetLink>
              )}
            </nav>

            <div className="mt-auto p-3 border-t border-line/60">
              <form action={logoutAction}>
                <button
                  className="w-full text-left px-3 py-2.5 rounded-md text-ink-mute hover:text-ink hover:bg-surface-2"
                  onClick={close}
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function DesktopLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md hover:bg-surface-2 text-ink-dim hover:text-ink transition"
    >
      {children}
    </Link>
  );
}

function SheetLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-3 rounded-md hover:bg-surface-2 text-ink font-medium"
    >
      {children}
    </Link>
  );
}
