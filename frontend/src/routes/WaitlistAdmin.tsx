import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, User, Clock, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function WaitlistAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "password") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchEntries() {
      try {
        const API_URL = import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000";
        const response = await fetch(`${API_URL}/waitlist/entries`);
        if (!response.ok) {
          throw new Error("Failed to fetch entries");
        }
        const data = await response.json();
        setEntries(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchEntries();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 overflow-hidden text-white">
        <motion.form 
          onSubmit={handleAuth} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl flex flex-col items-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Admin Access</h2>
          <p className="mb-6 font-mono text-xs text-white/40 text-center">Restricted area for developers</p>
          
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password"
            className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-white/30 focus:bg-white/5 focus:ring-1 focus:ring-white/30"
          />
          {authError && <p className="mb-4 font-mono text-xs text-red-400">{authError}</p>}
          <button type="submit" className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98]">
            Unlock
          </button>
          
          <Link
            to="/"
            className="mt-6 flex items-center gap-2 font-mono text-xs text-white/30 transition-colors hover:text-white/60"
          >
            <ArrowLeft className="h-3 w-3" /> Back Home
          </Link>
        </motion.form>

        {/* Noise texture */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.15] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black px-4 py-10 md:px-8 overflow-hidden text-white">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Waitlist Admin</h1>
            <p className="mt-1 font-mono text-sm text-white/40">
              {entries.length} {entries.length === 1 ? "person" : "people"} on the waitlist
            </p>
          </div>
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            Back Home
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-center">
            <User className="mb-4 h-8 w-8 text-white/20" />
            <h3 className="text-lg font-medium">No entries yet</h3>
            <p className="mt-1 font-mono text-sm text-white/40">Share your waitlist link to get started.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-6 py-4 font-medium text-white/40">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Name
                      </div>
                    </th>
                    <th className="px-6 py-4 font-medium text-white/40">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                      </div>
                    </th>
                    <th className="px-6 py-4 font-medium text-white/40">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Joined
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-white/90">
                        {entry.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-white/60">
                        {entry.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-white/40">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}
