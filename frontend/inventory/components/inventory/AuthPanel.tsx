"use client";

import { useMemo, useState } from "react";
import * as api from "@/lib/api";

interface AuthPanelProps {
  onAuthenticated: (name: string) => void;
}

type AuthMode = "login" | "signup" | "reset";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
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
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  const handleLogin = async () => {
    if (!isEmailValid || password.length < 8) {
      setMessage("Enter a valid email and password (min 8 chars).");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await api.login(email.trim(), password);
      const profileName = result?.user?.name || email.split("@")[0];
      onAuthenticated(profileName);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Login failed. Check your credentials.";
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (name.trim().length < 2 || !isEmailValid || password.length < 8) {
      setMessage("Name, valid email, and a password of at least 8 characters are required.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await api.signup(name.trim(), email.trim(), password, password);
      const profileName = result?.user?.name || name.trim();
      onAuthenticated(profileName);
    } catch (err: any) {
      const detail =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.message ||
        "Sign up failed.";
      setMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!/.+@.+\..+/.test(resetEmail.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await api.requestPasswordReset(resetEmail.trim());
      // For demo: generate a local OTP so the flow works without a real email server
      const localOtp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(localOtp);
      setMessage(
        `OTP sent to ${maskEmail(resetEmail)}. Demo OTP: ${localOtp}`,
      );
    } catch {
      const localOtp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(localOtp);
      setMessage(`OTP generated (email service not configured). Demo OTP: ${localOtp}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!generatedOtp || otp !== generatedOtp) {
      setMessage("OTP does not match.");
      return;
    }

    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setMessage("Passwords must match and be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await api.resetPassword(otp, newPassword, confirmPassword);
      setMessage("Password reset complete. Please log in.");
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Reset failed.";
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">CoreInventory Access</h1>
        <p className="mt-1 text-sm text-zinc-500">Secure sign in to continue to your dashboard.</p>

        <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
          {(["login", "signup", "reset"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setMessage("");
              }}
              className={`rounded-md px-2 py-2 text-sm capitalize ${
                mode === m ? "bg-zinc-900 text-white" : "text-zinc-700"
              }`}
            >
              {m === "reset" ? "Reset OTP" : m === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        {mode === "login" && (
          <div className="mt-5 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Work email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "Signing in…" : "Login"}
            </button>
          </div>
        )}

        {mode === "signup" && (
          <div className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Work email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Password (min 8 chars)"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </div>
        )}

        {mode === "reset" && (
          <div className="mt-5 space-y-3">
            <input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Account email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={requestOtp}
              disabled={isLoading}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {isLoading ? "Sending…" : "Send OTP"}
            </button>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              type="text"
              inputMode="numeric"
              placeholder="6-digit OTP"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={resetPassword}
              disabled={isLoading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "Resetting…" : "Reset password"}
            </button>
          </div>
        )}

        {message && (
          <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">{message}</p>
        )}
      </div>
    </div>
  );
}
