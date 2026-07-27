"use client";

import { useEffect, useState, useRef } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't show if already installed
    if (localStorage.getItem("pwaInstalled") === "true") return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem("pwaPromptDismissed") === "true") return;
    // Don't show if running in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };

    const handleAppInstalled = () => {
      localStorage.setItem("pwaInstalled", "true");
      closePrompt();
      deferredPrompt.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleTriggerInstall = () => {
      if (deferredPrompt.current) {
        deferredPrompt.current.prompt();
      } else {
        triggerPromptShow();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trigger-pwa-install", handleTriggerInstall);

    // Show every 30 seconds
    intervalRef.current = setInterval(() => {
      if (localStorage.getItem("pwaInstalled") === "true") return;
      if (sessionStorage.getItem("pwaPromptDismissed") === "true") return;

      triggerPromptShow();
    }, 30000);

    // Also trigger initial display after a brief delay
    const initialTimeout = setTimeout(() => {
      triggerPromptShow();
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      clearTimeout(initialTimeout);
    };
  }, []);

  const triggerPromptShow = () => {
    setShow(true);
    setProgress(100);
    // Slide-in animation trigger
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    // Start 8 second progress countdown
    const duration = 8000;
    const intervalTime = 50; // Update progress every 50ms
    const steps = duration / intervalTime;
    let currentStep = 0;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const percentLeft = Math.max(0, 100 - (currentStep / steps) * 100);
      setProgress(percentLeft);
      if (currentStep >= steps) {
        clearInterval(progressIntervalRef.current!);
      }
    }, intervalTime);

    // Auto close after 8 seconds
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    autoCloseTimeoutRef.current = setTimeout(() => {
      closePrompt();
    }, duration);
  };

  const closePrompt = () => {
    setVisible(false);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    setTimeout(() => {
      setShow(false);
    }, 300);
  };

  const handleDismiss = () => {
    closePrompt();
    sessionStorage.setItem("pwaPromptDismissed", "true");
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const choice = await deferredPrompt.current.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem("pwaInstalled", "true");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      deferredPrompt.current = null;
    }
    closePrompt();
  };

  if (!show) return null;

  return (
    <div
      className={`
        fixed top-20 right-4 left-4 sm:left-auto sm:w-[360px]
        z-[100] transition-all duration-300 ease-out
        ${visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95"}
      `}
    >
      <div className="relative overflow-hidden bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/20 p-2.5 flex items-start gap-3.5 backdrop-blur-xl">

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Close install prompt"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* App icon */}
        <div className="shrink-0">
          <img
            src="/osusu_logo2.png"
            alt="Osusu"
            className="h-12 w-12 rounded-xl object-cover shadow-md"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-5">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            Install Osusu 9ja
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Add to home screen for faster, standalone access.
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
              bg-gradient-to-r from-primary to-orange-500 text-white
              hover:from-primary/90 hover:to-orange-500/90
              shadow-lg shadow-primary/25 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="h-3 w-3" />
            Install
          </button>
        </div>

        {/* Bottom Progress Countdown Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/40">
          <div
            className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
