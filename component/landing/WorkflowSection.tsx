import React from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader, VideoPlayer } from "../ui";
import { workflowData } from "./data";

export const WorkflowSection: React.FC = () => {
  return (
    <Section id="how-it-works" background="overlay">
      <SectionHeader
        title="How FlowShare Works"
        highlightedWord="FlowShare"
        subtitle="Streamlined workflow from production entry to final allocation"
      />

      <div className="grid md:grid-cols-3 gap-8">
        {workflowData.map((step, index) => {
          const IconComponent = step.icon;

          return (
            <div key={index} className="relative">
              <div
                className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm ${COLORS.border.light} rounded-2xl p-8 hover:from-white/15 hover:to-white/10 transition-all duration-300`}
              >
                {/* Step Number */}
                <div className="text-6xl font-bold text-blue-500/20 mb-4">
                  {step.step}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} rounded-xl flex items-center justify-center mb-6`}
                >
                  <IconComponent className="w-8 h-8" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>

                {/* Description */}
                <p className={`${COLORS.text.muted} leading-relaxed mb-4`}>
                  {step.description}
                </p>

                {/* Details */}
                <div
                  className={`text-sm ${COLORS.primary.blue[400]} font-medium mb-6 border-l-2 ${COLORS.border.blue} pl-4`}
                >
                  {step.details}
                </div>
              </div>

              {/* Connector Arrow */}
              {index < workflowData.length - 1 && (
                <div
                  className={`hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r ${COLORS.primary.blue[500]} to-purple-500`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
};
