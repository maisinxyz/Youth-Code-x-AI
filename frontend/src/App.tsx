import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import Connect from "./routes/Connect";
import Landing from "./routes/Landing";
import Loading from "./routes/Loading";

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
    <Routes>
      <Route path="/" element={<Landing />} />
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
  );
}
