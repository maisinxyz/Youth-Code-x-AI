import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { WordmarkPanel } from "../panels/WordmarkPanel";

export default function Waitlist() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/waitlist/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to join waitlist");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 overflow-hidden">
      <WordmarkPanel />

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 45%, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Pill label */}
        <motion.span
          className="mb-6 inline-block rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Early Access
        </motion.span>

        {/* Title */}
        <motion.h1
          className="text-center font-display text-4xl md:text-5xl font-bold tracking-tight text-white mb-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Join the waitlist
        </motion.h1>

        {/* Description */}
        <motion.p
          className="mb-8 text-center max-w-sm font-mono text-sm text-white/30 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          We're building the semantic memory layer for your team.
          Leave your mark — early access is on the horizon.
        </motion.p>

        {/* Form Container */}
        <motion.div
          className="w-full rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl md:p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {success ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-6 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Application Complete</h3>
              <p className="mb-6 font-mono text-sm text-white/50">
                You're on the list! We'll reach out to {email} when your invite is ready.
              </p>
              <Link
                to="/"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                Return to main page
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="pl-1 font-mono text-xs tracking-wider text-white/50 uppercase">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-white/30 focus:bg-white/5 focus:ring-1 focus:ring-white/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="pl-1 font-mono text-xs tracking-wider text-white/50 uppercase">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ada@example.com"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-white/30 focus:bg-white/5 focus:ring-1 focus:ring-white/30"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Secure your spot
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form subtle glow */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>

        {/* Back link */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back Home
          </Link>
        </motion.div>
      </motion.div>

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}
