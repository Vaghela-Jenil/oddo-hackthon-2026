"use client";

import { useMemo, useState } from "react";

interface AuthPanelProps {
  onAuthenticated: (profileName: string) => void;
}

type AuthMode = "login" | "signup" | "reset";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const isEmailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  const handleLogin = () => {
    if (!isEmailValid || password.length < 8) {
      setMessage("Enter a valid email and password (min 8 chars).");
      return;
    }

    const profile = email.split("@")[0];
    onAuthenticated(profile);
  };

  const handleSignup = () => {
    if (name.trim().length < 2 || !isEmailValid || password.length < 8) {
      setMessage("Name, email and strong password are required.");
      return;
    }

    onAuthenticated(name.trim());
  };

  const requestOtp = () => {
    if (!/.+@.+\..+/.test(resetEmail.trim())) {
      setMessage("Enter a valid account email.");
      return;
    }

    const nextOtp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(nextOtp);
    setMessage(`OTP sent to ${maskEmail(resetEmail)}. Use code: ${nextOtp}`);
  };

  const resetPassword = () => {
    if (!generatedOtp) {
      setMessage("Request an OTP first.");
      return;
    }

    if (otp !== generatedOtp) {
      setMessage("OTP does not match.");
      return;
    }

    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setMessage("Passwords must match and be at least 8 characters.");
      return;
    }

    setMessage("Password reset complete. Please login.");
    setMode("login");
    setPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">CoreInventory Access</h1>
        <p className="mt-1 text-sm text-zinc-500">Secure sign in to continue to your dashboard.</p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-zinc-100 p-1">
          {[
            { key: "login", label: "Login" },
            { key: "signup", label: "Sign up" },
            { key: "reset", label: "Reset OTP" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setMode(item.key as AuthMode);
                setMessage("");
              }}
              className={`rounded-md px-2 py-2 text-sm ${
                mode === item.key ? "bg-zinc-900 text-white" : "text-zinc-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === "login" && (
          <div className="mt-5 space-y-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Work email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            >
              Login
            </button>
          </div>
        )}

        {mode === "signup" && (
          <div className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Work email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Create password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSignup}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            >
              Create account
            </button>
          </div>
        )}

        {mode === "reset" && (
          <div className="mt-5 space-y-3">
            <input
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Account email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={requestOtp}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
            >
              Send OTP
            </button>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              type="text"
              inputMode="numeric"
              placeholder="6 digit OTP"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={resetPassword}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            >
              Reset password
            </button>
          </div>
        )}

        {message && <p className="mt-4 text-xs text-zinc-600">{message}</p>}
      </div>
    </div>
  );
}
