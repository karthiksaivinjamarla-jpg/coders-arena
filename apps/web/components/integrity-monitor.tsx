"use client";

import { useEffect } from "react";

type Props = { contestId: string; clientSession?: string };

export function IntegrityMonitor({ contestId, clientSession }: Props) {
  useEffect(() => {
    const send = (eventType: "visibility_hidden"|"visibility_visible"|"fullscreen_exit"|"fullscreen_enter"|"window_blur"|"window_focus") => {
      void fetch("/api/integrity-events", {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify({ contestId, eventType, clientSession })
      });
    };

    const onVisibility = () => send(document.hidden ? "visibility_hidden" : "visibility_visible");
    const onBlur = () => send("window_blur");
    const onFocus = () => send("window_focus");
    const onFullscreen = () => send(document.fullscreenElement ? "fullscreen_enter" : "fullscreen_exit");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [contestId, clientSession]);

  return null;
}
