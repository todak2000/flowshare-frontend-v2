import React from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader } from "../ui";
import { problemData } from "./data";

/**
 * Problem section - establishes pain points before presenting solution
 */
export const ProblemSection: React.FC = () => {
  return (
    <Section background="overlay" maxWidth="lg">
      <SectionHeader
        title={problemData.title}
        subtitle={problemData.subtitle}
      />

      {/* Problem Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {problemData.problems.map((problem, index) => {
          const IconComponent = problem.icon;
          return (
            <div
              key={index}
              className={`flex items-start space-x-4 p-6 rounded-xl ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} hover:${COLORS.background.glassHover} transition-all`}
            >
              <div className="flex-shrink-0">
                <IconComponent className="w-6 h-6 text-red-400" />
              </div>
              <p className={`${COLORS.text.primary} leading-relaxed`}>
                {problem.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Conclusion */}
      <div className="text-center mt-12">
        <div
          className={`inline-block px-8 py-4 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} rounded-full`}
        >
          <p className="text-xl font-bold text-white">
            {problemData.conclusion}
          </p>
        </div>
      </div>
    </Section>
  );
};
