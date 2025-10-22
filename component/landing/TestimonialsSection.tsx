import React from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader } from "../ui";
import { testimonialsData } from "./data";
import { CheckCircle, Quote } from "lucide-react";

export const TestimonialsSection: React.FC = () => {
  return (
    <Section background="transparent" maxWidth="lg">
      <SectionHeader
        title="Proven Results from the Field"
        highlightedWord="Proven"
        subtitle="Real companies, real results"
      />

      <div className="grid md:grid-cols-2 gap-8">
        {testimonialsData.map((testimonial, index) => (
          <div
            key={index}
            className={`${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} rounded-2xl p-8 hover:${COLORS.background.glassHover} transition-all duration-300`}
          >
            {/* Quote Icon */}
            <Quote className={`w-10 h-10 ${COLORS.primary.blue[400]} mb-4`} />

            {/* Company */}
            <h3 className="text-2xl font-bold mb-4">{testimonial.company}</h3>

            {/* Quote */}
            <p
              className={`text-lg ${COLORS.text.primary} leading-relaxed mb-6 italic`}
            >
              "{testimonial.quote}"
            </p>

            {/* Author */}
            <div className="mb-6">
              <p className="font-semibold">{testimonial.author}</p>
              <p className={`text-sm ${COLORS.text.muted}`}>
                {testimonial.role}
              </p>
            </div>

            {/* Results */}
            <div className={`border-t ${COLORS.border.light} pt-6`}>
              <p className="font-semibold mb-3">Results:</p>
              <div className="space-y-2">
                {testimonial.results.map((result, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <CheckCircle
                      className={`w-5 h-5 ${COLORS.primary.blue[400]} flex-shrink-0 mt-0.5`}
                    />
                    <span className={`text-sm ${COLORS.text.muted}`}>
                      {result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
