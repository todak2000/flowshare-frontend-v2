"use client";
import React, { useState } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoSrc?: string;
  posterSrc?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  badge?: string;
  className?: string;
  placeholderText?: string;
}

/**
 * Reusable video player component with fallback placeholder
 * Shows placeholder with call-to-action when video source is not provided
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSrc = "/Flowshare_Demo_2.mov",
  posterSrc,
  autoPlay = false,
  loop = true,
  muted = true,
  badge,
  className = "",
  placeholderText = "Product demo video coming soon",
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Show placeholder if no video source provided
  if (!videoSrc) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900 ${className}`}
      >
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-white text-lg font-medium">{placeholderText}</p>
            <p className="text-gray-400 text-sm mt-2">
              Experience the full workflow in action
            </p>
          </div>
        </div>
        {badge && (
          <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-full">
            <span className="text-white text-sm">{badge}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl ${className}`}
    >
      <video
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        poster={posterSrc}
        className="w-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {badge && (
        <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-full">
          <span className="text-white text-sm">{badge}</span>
        </div>
      )}
    </div>
  );
};
