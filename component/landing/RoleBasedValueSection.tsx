"use client";
import React, { useState } from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader, VideoPlayer } from "../ui";
import { roleBasedValueData } from "./data";
import { CheckCircle } from "lucide-react";

export const RoleBasedValueSection: React.FC = () => {
  const [activeRole, setActiveRole] = useState(0);

  return (
    <Section id="use-cases" background="transparent">
      <SectionHeader
        title="Built for Your Role"
        highlightedWord="Your"
        subtitle="Different stakeholders, unified platform"
      />

      {/* Role Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {roleBasedValueData.map((roleData, index) => {
          const IconComponent = roleData.icon;
          const isActive = activeRole === index;

          return (
            <button
              key={index}
              onClick={() => setActiveRole(index)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white shadow-lg scale-105`
                  : `${COLORS.background.glass} ${COLORS.border.light} hover:${COLORS.background.glassHover}`
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span>{roleData.role}</span>
            </button>
          );
        })}
      </div>

      {/* Active Role Content */}
      <div
        className={`${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} rounded-2xl p-8 md:p-12`}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div>
            <h3 className="text-3xl font-bold mb-6">
              {roleBasedValueData[activeRole].headline}
            </h3>
            <div className="space-y-4">
              {roleBasedValueData[activeRole].benefits.map((benefit, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <CheckCircle
                    className={`w-6 h-6 ${COLORS.primary.blue[400]} flex-shrink-0 mt-0.5`}
                  />
                  <span className={`${COLORS.text.primary} leading-relaxed`}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Video */}
          <div>
            <VideoPlayer
              placeholderText={roleBasedValueData[activeRole].videoPlaceholder}
            />
          </div>
        </div>
      </div>
    </Section>
  );
};
