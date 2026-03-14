"use client";

import type { ReactNode } from "react";

export type NavigationKey =
  | "Dashboard"
  | "Products"
  | "Receipts"
  | "Delivery"
  | "Internal"
  | "Adjustments"
  | "Move History"
  | "Setting";

interface SidebarProps {
  activeView: NavigationKey;
  onNavigate: (view: NavigationKey) => void;
  onLogout: () => void;
  profileName: string;
}

const navItems: NavigationKey[] = [
  "Dashboard",
  "Products",
  "Receipts",
  "Delivery",
  "Internal",
  "Adjustments",
  "Move History",
  "Setting",
];

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

export function Sidebar({ activeView, onNavigate, onLogout, profileName }: SidebarProps) {
  return (
    <aside className="flex h-full w-full max-w-64 flex-col border-r border-zinc-200 bg-zinc-100 p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900">CoreInventory</h1>
        <p className="text-xs text-zinc-500">Inventory Management System</p>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Main Navigation">
        {navItems.map((item) => (
          <NavButton key={item} active={activeView === item} onClick={() => onNavigate(item)}>
            {item}
          </NavButton>
        ))}
      </nav>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-3">
        <p className="text-xs text-zinc-500">My Profile</p>
        <p className="truncate text-sm font-medium text-zinc-900">{profileName}</p>
        <button
          type="button"
          className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
