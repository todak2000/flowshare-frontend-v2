"use client";
import React, { useState, useEffect } from "react";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { COLORS } from "../../constants/ui";
import { VideoPlayer } from "../ui/VideoPlayer";
import { heroData, statsData } from "./data";
import { AnimatedBackground } from "../Home";

interface HeroSectionProps {
  onGetStarted: () => void;
  onDemo: () => void;
  onScrollToFeatures: () => void;
}

interface StatCardProps {
  stat: (typeof statsData)[0];
  index: number;
  isVisible: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ stat, index, isVisible }) => {
  const IconComponent = stat.icon;
  return (
    <div
      className={`${COLORS.background.glass} backdrop-blur-sm ${
        COLORS.border.light
      } rounded-xl p-6 transition-all duration-700 hover:${
        COLORS.background.glassHover
      } ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      <div
        className={`flex items-center justify-center mb-3 ${COLORS.primary.blue[400]}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold mb-1">{stat.value}</div>
      <div className={`text-sm ${COLORS.text.muted}`}>{stat.label}</div>
    </div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onDemo,
  onScrollToFeatures,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen mt-[100px] flex items-center justify-center px-6">
      <AnimatedBackground />
      <div
        className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Badge */}
        <div className="mb-6">
          <span
            className={`inline-block px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full text-sm ${COLORS.border.blue}`}
          >
            🚀 {heroData.badge}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <span
            className={`bg-gradient-to-r ${COLORS.primary.blue[50]} via-purple-400 ${COLORS.primary.cyan[400]} bg-clip-text text-transparent`}
          >
            {heroData.headline}
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className={`text-xl md:text-2xl ${COLORS.text.secondary} mb-8 max-w-3xl mx-auto leading-relaxed`}
        >
          {heroData.subheadline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={onDemo}
            className={`px-8 py-4 cursor-pointer rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]}`}
          >
            <Play className="w-5 h-5" />
            <span>{heroData.ctaPrimary.text}</span>
          </button>
          <button
            onClick={onGetStarted}
            className={`px-8 py-4 cursor-pointer rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 border ${COLORS.border.light} hover:${COLORS.background.glassHover}`}
          >
            <span>{heroData.ctaSecondary.text}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Video */}
        <div className="mb-12">
          <VideoPlayer
            placeholderText={heroData.videoPlaceholder}
            badge={heroData.videoBadge}
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {statsData.map((stat, index) => (
            <StatCard
              key={index}
              stat={stat}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={onScrollToFeatures}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
      >
        <ChevronDown className={`w-6 h-6 ${COLORS.text.muted}`} />
      </button>
    </section>
  );
};
