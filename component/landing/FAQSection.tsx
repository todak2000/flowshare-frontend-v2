"use client";
import React, { useState } from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader } from "../ui";
import { faqData } from "./data";
import { ChevronDown } from "lucide-react";

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Section id="faq" background="overlay" maxWidth="lg">
      <SectionHeader
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about FlowShare"
      />

      <div className="space-y-4">
        {faqData.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} rounded-xl overflow-hidden transition-all duration-300 hover:${COLORS.background.glassHover}`}
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 ${COLORS.text.muted} flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className={`px-6 pb-6 ${COLORS.text.muted} leading-relaxed`}>
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
};
