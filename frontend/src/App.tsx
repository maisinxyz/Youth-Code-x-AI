import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { Toaster } from "./components/ui/Toaster";
import Auth from "./routes/Auth";
import AuthProxy from "./routes/AuthProxy";
import Connect from "./routes/Connect";
import Landing from "./routes/Landing";
import Loading from "./routes/Loading";
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import Waitlist from "./routes/Waitlist";
import WaitlistAdmin from "./routes/WaitlistAdmin";

const Brain = lazy(() => import("./routes/Brain"));

function BrainFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg-void text-text-muted">
      <span className="text-sm tracking-wide">loading brain…</span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth-proxy" element={<AuthProxy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/waitlist-admin" element={<WaitlistAdmin />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/loading" element={<Loading />} />
        <Route
          path="/brain"
          element={
            <Suspense fallback={<BrainFallback />}>
              <Brain />
            </Suspense>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}
