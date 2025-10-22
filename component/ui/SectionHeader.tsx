import React from "react";
import { COLORS } from "../../constants/ui";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  highlightedWord?: string;
  centered?: boolean;
  className?: string;
}

/**
 * Reusable section header component with optional highlighting
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  highlightedWord,
  centered = true,
  className = "",
}) => {
  const renderTitle = () => {
    if (!highlightedWord) {
      return <span>{title}</span>;
    }

    const parts = title.split(highlightedWord);
    return (
      <>
        {parts[0]}
        <span
          className={`bg-gradient-to-r ${COLORS.primary.blue[50]} ${COLORS.primary.purple[400]} bg-clip-text text-transparent`}
        >
          {highlightedWord}
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={`${centered ? "text-center" : ""} mb-16 ${className}`}>
      <h2
        className="text-4xl md:text-5xl font-bold mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {renderTitle()}
      </h2>
      {subtitle && (
        <p className={`text-xl ${COLORS.text.secondary} max-w-3xl ${centered ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
