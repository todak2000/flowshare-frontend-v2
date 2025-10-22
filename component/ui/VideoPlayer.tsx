"use client";
import React from "react";
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
 * Extract YouTube video ID from various YouTube URL formats
 */
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

/**
 * Reusable video player component with fallback placeholder
 * Shows placeholder with call-to-action when video source is not provided
 * Supports both YouTube URLs and direct video files
 */git rm --cached
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSrc = "https://www.youtube.com/watch?v=b0BSD6JAadU",
  posterSrc,
  autoPlay = false,
  loop = true,
  muted = true,
  badge,
  className = "",
  placeholderText = "Product demo video coming soon",
}) => {

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

  // Check if this is a YouTube URL
  const youtubeVideoId = getYouTubeVideoId(videoSrc);

  // Render YouTube iframe if it's a YouTube URL
  if (youtubeVideoId) {
    const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?${autoPlay ? 'autoplay=1&' : ''}${muted ? 'mute=1&' : ''}${loop ? 'loop=1&playlist=' + youtubeVideoId + '&' : ''}rel=0`;

    return (
      <div
        className={`relative rounded-2xl overflow-hidden shadow-2xl ${className}`}
      >
        <iframe
          src={embedUrl}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
        {badge && (
          <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-full">
            <span className="text-white text-sm">{badge}</span>
          </div>
        )}
      </div>
    );
  }

  // Render standard HTML5 video player for direct video files
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
