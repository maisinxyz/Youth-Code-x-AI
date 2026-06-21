import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { WordmarkPanel } from "../panels/WordmarkPanel";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // After logging into the Engram account, redirect to the proxy connected page
    navigate("/auth-proxy");
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <WordmarkPanel />

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 70%)",
        }}
      />

      {/* Content container */}
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.p
            className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back
          </motion.p>
          <motion.h1
            className="font-display text-3xl font-bold tracking-tight text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Log in to your account
          </motion.h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-sm text-white placeholder-white/20 transition-colors focus:border-white/30 focus:bg-white/[0.04] focus:outline-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="mb-1.5 flex justify-between font-mono text-[11px] uppercase tracking-wider text-white/40">
              <span>Password</span>
              <span className="text-white/20 hover:text-white/50 cursor-pointer transition-colors">Forgot?</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-sm text-white placeholder-white/20 transition-colors focus:border-white/30 focus:bg-white/[0.04] focus:outline-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4"
          >
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-mono text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-black px-2 text-white/30">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-3 font-mono text-sm text-white transition-all hover:bg-white/[0.04] active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </form>

        <motion.p
          className="mt-6 text-center font-mono text-xs text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Don't have an account?{" "}
          <Link to="/signup" className="text-white/60 hover:text-white cursor-pointer transition-colors">
            Sign up
          </Link>
        </motion.p>
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
