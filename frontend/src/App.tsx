import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { Toaster } from "./components/ui/Toaster";
import Auth from "./routes/Auth";
import Connect from "./routes/Connect";
import Landing from "./routes/Landing";
import Loading from "./routes/Loading";
import Waitlist from "./routes/Waitlist";

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
        <Route path="/waitlist" element={<Waitlist />} />
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
