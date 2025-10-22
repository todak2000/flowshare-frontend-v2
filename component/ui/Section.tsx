import React from "react";

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  background?: "transparent" | "overlay" | "gradient";
  padding?: "small" | "medium" | "large";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Reusable section wrapper for consistent spacing and styling
 */
export const Section: React.FC<SectionProps> = ({
  id,
  children,
  className = "",
  background = "transparent",
  padding = "large",
  maxWidth = "xl",
}) => {
  const bgClasses = {
    transparent: "",
    overlay: "bg-white/5 backdrop-blur-sm",
    gradient: "bg-gradient-to-br from-slate-900/20 to-slate-800/20",
  };

  const paddingClasses = {
    small: "py-10 px-6",
    medium: "py-16 px-6",
    large: "py-20 px-6",
  };

  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <section
      id={id}
      className={`${paddingClasses[padding]} ${bgClasses[background]} ${className}`}
    >
      <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>{children}</div>
    </section>
  );
};
