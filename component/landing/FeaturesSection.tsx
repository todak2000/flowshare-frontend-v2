"use client";
import React, { useState, useEffect } from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader, VideoPlayer } from "../ui";
import { featuresData } from "./data";

export const FeaturesSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featuresData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Section id="features">
      <SectionHeader
        title="Powerful Features"
        highlightedWord="Powerful"
        subtitle="Built for the modern oil & gas industry, our platform delivers transparency, efficiency, and trust in every transaction."
      />

      <div className="grid md:grid-cols-2 gap-8">
        {featuresData.map((feature, index) => {
          const IconComponent = feature.icon;
          const isActive = activeFeature === index;

          return (
            <div
              key={index}
              className={`group ${COLORS.background.glass} backdrop-blur-sm ${
                COLORS.border.light
              } rounded-2xl p-8 hover:${
                COLORS.background.glassHover
              } transition-all duration-500 transform hover:scale-105 ${
                isActive
                  ? `ring-2 ${COLORS.border.ring} ${COLORS.background.glassHover}`
                  : ""
              }`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]}`
                    : `${COLORS.background.glass} group-hover:bg-gradient-to-r group-hover:${COLORS.primary.blue[600]} group-hover:${COLORS.primary.purple[600]}`
                }`}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>

              {/* Description */}
              <p className={`${COLORS.text.muted} leading-relaxed mb-4`}>
                {feature.description}
              </p>

             
              
            </div>
          );
        })}
      </div>
    </Section>
  );
};
