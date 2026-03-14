"use client";

import { useMemo, useState } from "react";
import * as api from "@/lib/api";

interface AuthPanelProps {
  onAuthenticated: (profileName: string) => void;
}

type AuthMode = "login" | "signup" | "reset";
type UserRole = "STAFF" | "MANAGER";

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
  const [role, setRole] = useState<UserRole>("STAFF");

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("error");
  const [resetState, setResetState] = useState<"email" | "otp">("email");

  const isEmailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const isResetEmailValid = useMemo(() => /.+@.+\..+/.test(resetEmail.trim()), [resetEmail]);

  const handleLogin = async () => {
    if (!isEmailValid || password.length < 8) {
      setMessage("Enter a valid email and password (min 8 characters).");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await api.login(email.trim(), password);
      api.setToken(result.token);
      api.setUser(result.user);
      setMessage(`Welcome back, ${result.user.name}!`);
      setMessageType("success");
      onAuthenticated(result.user.name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (name.trim().length < 2) {
      setMessage("Name must be at least 2 characters.");
      setMessageType("error");
      return;
    }

    if (!isEmailValid) {
      setMessage("Enter a valid email address.");
      setMessageType("error");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await api.signup(name.trim(), email.trim(), password, confirmPassword);
      api.setToken(result.token);
      api.setUser(result.user);
      setMessage(`Account created successfully! Welcome, ${result.user.name}.`);
      setMessageType("success");
      onAuthenticated(result.user.name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!isResetEmailValid) {
      setMessage("Enter a valid account email.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await api.forgotPassword(resetEmail.trim());
      setResetState("otp");
      setMessage(`OTP sent to ${maskEmail(resetEmail)}. Check your email.`);
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send OTP. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (resetState !== "otp") {
      setMessage("Request an OTP first.");
      setMessageType("error");
      return;
    }

    if (!otp || otp.length !== 6) {
      setMessage("OTP must be 6 digits.");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setMessage("Passwords must match and be at least 8 characters.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await api.verifyOtpWithEmail(resetEmail.trim(), otp);
      await api.resetPasswordWithEmail(resetEmail.trim(), otp, newPassword);
      setMessage("Password reset successfully. Please login with your new password.");
      setMessageType("success");
      setMode("login");
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setResetState("email");
      setEmail(resetEmail);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-900 to-zinc-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold text-white">CoreInventory</h1>
          <p className="mt-2 text-sm text-zinc-400">Smart warehouse management system</p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          {/* Tab Navigation */}
          <div className="mb-6 grid grid-cols-3 gap-2 rounded-lg bg-zinc-800 p-1">
            {[
              { key: "login", label: "Login", icon: "🔐" },
              { key: "signup", label: "Sign up", icon: "✨" },
              { key: "reset", label: "Reset", icon: "🔑" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMode(item.key as AuthMode);
                  setMessage("");
                  setResetState("email");
                }}
                className={`rounded-md px-2 py-2.5 text-xs font-medium transition-all ${
                  mode === item.key
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-zinc-400 hover:text-white"
                }`}
                disabled={isLoading}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                messageType === "success"
                  ? "border border-green-500/30 bg-green-500/10 text-green-200"
                  : messageType === "info"
                    ? "border border-blue-500/30 bg-blue-500/10 text-blue-200"
                    : "border border-red-500/30 bg-red-500/10 text-red-200"
              }`}
            >
              {messageType === "success" && "✓ "}
              {messageType === "error" && "✕ "}
              {messageType === "info" && "ℹ "}
              {message}
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading || !isEmailValid || password.length < 8}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></span>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          )}

          {/* Signup Form */}
          {mode === "signup" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="STAFF">Staff - Basic Operations</option>
                  <option value="MANAGER">Manager - Full Control</option>
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  {role === "MANAGER"
                    ? "Manage warehouse, users, and system settings"
                    : "Handle inventory operations and stock movements"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-zinc-500">At least 8 characters</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirm Password</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleSignup}
                disabled={isLoading || name.length < 2 || !isEmailValid || password.length < 8}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></span>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
              <p className="text-center text-xs text-zinc-400">
                By signing up, you agree to our Terms & Privacy Policy
              </p>
            </div>
          )}

          {/* Password Reset Form */}
          {mode === "reset" && (
            <div className="space-y-3">
              {resetState === "email" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Account Email</label>
                    <input
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === "Enter" && !isLoading && requestOtp()}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={isLoading || !isResetEmailValid}
                    className="w-full rounded-lg border border-blue-600 bg-transparent px-4 py-2.5 text-sm font-semibold text-blue-400 transition-all hover:bg-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                  <p className="text-center text-xs text-zinc-500">
                    We'll send a one-time password to your email
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                    ✓ OTP sent to {maskEmail(resetEmail)}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">6-Digit OTP</label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">New Password</label>
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirm Password</label>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === "Enter" && !isLoading && resetPassword()}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={resetPassword}
                    disabled={isLoading || otp.length !== 6 || newPassword.length < 8}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetState("email");
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isLoading}
                    className="w-full text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    Back to email entry
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          © 2026 CoreInventory. Enterprise Grade Warehouse Management.
        </p>
      </div>
    </div>
  );
}
