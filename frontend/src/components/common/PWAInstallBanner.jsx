import React from "react";
import { usePWAInstallPrompt } from "../../hooks/usePWAInstallPrompt";

const PWAInstallBanner = () => {
  const { canInstall, install, installed } = usePWAInstallPrompt();
  const [hidden, setHidden] = React.useState(false);

  if (!canInstall || hidden || installed) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-4 sm:px-6"
      style={{ pointerEvents: "auto" }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur">
        <div className="hidden sm:block h-9 w-9 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
          <span className="text-indigo-300 text-lg">▲</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-300">
            Install Align
          </p>
          <p className="text-sm text-slate-100">
            Add Align to your home screen for a faster, app-like experience.
          </p>
        </div>
        <button
          onClick={install}
          className="rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-400 transition"
        >
          Install
        </button>
        <button
          onClick={() => setHidden(true)}
          className="ml-1 text-xs text-slate-400 hover:text-slate-200"
        >
          Not now
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
