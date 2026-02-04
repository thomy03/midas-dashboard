"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

type NotificationState = "unsupported" | "denied" | "default" | "granted" | "loading";

export function NotificationButton() {
  const [state, setState] = useState<NotificationState>("loading");

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as NotificationState);
  }, []);

  const requestPermission = async () => {
    if (state === "unsupported" || state === "denied") return;
    
    setState("loading");
    
    try {
      // Register service worker first
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      setState(permission as NotificationState);
      
      if (permission === "granted") {
        // Show test notification
        new Notification("Midas Notifications Enabled", {
          body: "You'll receive alerts for trading signals.",
          icon: "/midas-logo.png",
        });
      }
    } catch (error) {
      console.error('Failed to setup notifications:', error);
      setState("default");
    }
  };

  const testNotification = () => {
    if (state !== "granted") return;
    
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification("Test Alert", {
        body: "Midas notifications are working!",
        icon: "/midas-logo.png",
        // vibrate: [100, 50, 100], // Not supported in NotificationOptions type
      });
    });
  };

  const getButtonContent = () => {
    switch (state) {
      case "loading":
        return {
          icon: <Loader2 size={20} className="animate-spin" />,
          text: "Loading...",
          disabled: true,
          className: "bg-zinc-700",
        };
      case "unsupported":
        return {
          icon: <BellOff size={20} />,
          text: "Not Supported",
          disabled: true,
          className: "bg-zinc-700 opacity-50",
        };
      case "denied":
        return {
          icon: <BellOff size={20} />,
          text: "Blocked",
          disabled: true,
          className: "bg-red-500/20 text-red-400",
        };
      case "granted":
        return {
          icon: <BellRing size={20} />,
          text: "Enabled",
          disabled: false,
          className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          onClick: testNotification,
        };
      default:
        return {
          icon: <Bell size={20} />,
          text: "Enable Notifications",
          disabled: false,
          className: "bg-blue-500 hover:bg-blue-600",
          onClick: requestPermission,
        };
    }
  };

  const content = getButtonContent();

  return (
    <div className="space-y-2">
      <button
        onClick={content.onClick}
        disabled={content.disabled}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-700/50 transition-colors ${content.className}`}
      >
        {content.icon}
        <div className="flex-1 text-left">
          <div className="font-medium">{content.text}</div>
          <div className="text-xs text-zinc-500">
            {state === "granted" 
              ? "Tap to send test notification" 
              : state === "denied"
              ? "Please enable in browser settings"
              : state === "unsupported"
              ? "Your browser doesn't support notifications"
              : "Get alerts for trades and signals"
            }
          </div>
        </div>
      </button>
    </div>
  );
}
