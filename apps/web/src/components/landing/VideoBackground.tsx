'use client';

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Background Video Layer */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        muted
        loop
        playsInline
      />
      
      {/* Video Overlay (Removed expensive backdrop-blur for performance) */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Decorative Gradients (Swapped from expensive CSS blurs to fast native radial gradients) */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.4)_0%,transparent_70%)] rounded-full" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.4)_0%,transparent_70%)] rounded-full" />
    </div>
  );
}
