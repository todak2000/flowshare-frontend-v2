# FlowShare Landing Page - Modular Architecture

This directory contains the modular, reusable components for the FlowShare landing page, built following KISS (Keep It Simple, Stupid) and DRY (Don't Repeat Yourself) principles.

## 📁 Directory Structure

```
landing/
├── data.ts                      # Content configuration (all copy text)
├── HeroSection.tsx              # Hero section with video and stats
├── ProblemSection.tsx           # Problem statement section
├── FeaturesSection.tsx          # Features grid with rotating highlights
├── WorkflowSection.tsx          # 3-step workflow explanation
├── TestimonialsSection.tsx      # Customer testimonials and results
├── RoleBasedValueSection.tsx    # Role-based value propositions
├── FAQSection.tsx               # Frequently asked questions
├── ROICalculator.tsx            # Interactive ROI calculator
├── index.ts                     # Export barrel file
└── README.md                    # This file

ui/
├── VideoPlayer.tsx              # Reusable video player with placeholder
├── Section.tsx                  # Consistent section wrapper
├── SectionHeader.tsx            # Reusable section headers
└── index.ts                     # Export barrel file
```

## 🎯 Key Principles

### KISS (Keep It Simple, Stupid)
- Each component has a single, clear responsibility
- Simple prop interfaces with sensible defaults
- No over-engineering or unnecessary complexity

### DRY (Don't Repeat Yourself)
- Shared UI components in `/ui` directory
- Content separated from presentation in `data.ts`
- Reusable patterns extracted into components

### Modularity
- Each section is self-contained and can be rearranged
- Easy to add/remove sections without breaking others
- Clear interfaces between components

## 🚀 Quick Start

### 1. Update Content
Edit `data.ts` to change all text content without touching UI code:

```typescript
export const heroData = {
  headline: "Your New Headline Here",
  subheadline: "Your new description...",
  // ...
};
```

### 2. Rearrange Sections
Edit `HomeV2.tsx` to change section order:

```tsx
{/* Move sections around */}
<HeroSection {...props} />
<TestimonialsSection />  {/* Moved testimonials up */}
<FeaturesSection />
```

### 3. Hide/Show Sections
Comment out any section you don't need:

```tsx
{/* <RoleBasedValueSection /> */}  {/* Temporarily hidden */}
```

### 4. Add Videos
Update `data.ts` with video URLs:

```typescript
export const heroData = {
  videoSrc: "/videos/hero-demo.mp4",
  posterSrc: "/videos/hero-thumbnail.jpg",
  // ...
};
```

## 📝 Customization Guide

### Updating Copy
All text content lives in `data.ts`. No need to touch component files:

```typescript
// data.ts
export const featuresData = [
  {
    title: "Your Feature Title",
    description: "Your feature description...",
    proof: "Your proof point...",
  },
  // ...
];
```

### Adding a New Section
1. Create new component in `landing/` directory:
```tsx
// NewSection.tsx
export const NewSection: React.FC = () => {
  return <Section id="new-section">
    <SectionHeader title="New Section" />
    {/* Your content */}
  </Section>;
};
```

2. Export from `index.ts`:
```typescript
export { NewSection } from "./NewSection";
```

3. Add to `HomeV2.tsx`:
```tsx
import { NewSection } from "./landing";
// ...
<NewSection />
```

### Styling Changes
Components use the centralized color system from `constants/ui.ts`:

```typescript
import { COLORS } from "../../constants/ui";

// Use in components:
<div className={`${COLORS.primary.blue[600]} ${COLORS.text.muted}`}>
```

### Video Integration
The `VideoPlayer` component handles both video and placeholder states:

```tsx
<VideoPlayer
  videoSrc="/path/to/video.mp4"          // Optional
  posterSrc="/path/to/thumbnail.jpg"     // Optional
  badge="⚡ Fast demo"                    // Optional
  placeholderText="Coming soon"          // Shows when no video
/>
```

Without `videoSrc`, it shows a nice placeholder with call-to-action.

## 🎨 Component API Reference

### HeroSection
```tsx
<HeroSection
  onGetStarted={() => {}}  // Register button handler
  onDemo={() => {}}        // Demo button handler
  onScrollToFeatures={() => {}}  // Scroll arrow handler
/>
```

### Section (Wrapper)
```tsx
<Section
  id="section-id"                    // For navigation
  background="transparent|overlay|gradient"
  padding="small|medium|large"
  maxWidth="sm|md|lg|xl|full"
>
  {children}
</Section>
```

### SectionHeader
```tsx
<SectionHeader
  title="Your Title"
  subtitle="Optional subtitle"
  highlightedWord="Word"  // Gradient highlight
  centered={true}          // Default
/>
```

### ROICalculator
```tsx
<ROICalculator
  onScheduleDemo={() => {}}  // CTA button handler
/>
```

## 📊 Data Structure Reference

### Stats Data
```typescript
export const statsData = [
  {
    value: "99.9%",
    label: "System Uptime",
    icon: TrendingUp,  // Lucide icon
  },
];
```

### Features Data
```typescript
export const featuresData = [
  {
    icon: Shield,
    title: "Feature Title",
    description: "Feature description...",
    proof: "Customer Result: ...",
    videoPlaceholder: "Video description",
  },
];
```

### Testimonials Data
```typescript
export const testimonialsData = [
  {
    company: "Company Name",
    quote: "Testimonial quote...",
    author: "Person Name",
    role: "Job Title",
    results: ["Result 1", "Result 2", "Result 3"],
  },
];
```

## 🔧 Maintenance Tips

### Adding New Content
1. Add data to `data.ts`
2. Component automatically picks it up
3. No need to modify component logic

### Updating Styles
1. Prefer using COLORS constants
2. Use Tailwind utility classes
3. Keep responsive design in mind (use md: prefixes)

### Performance
- VideoPlayer component lazy-loads videos
- Components use React.memo where appropriate
- Images should be optimized before adding

## 🎬 Video Production Checklist

When you're ready to add real videos:

1. **Hero Video** (highest priority)
   - Duration: 30-45 seconds
   - Resolution: 1920x1080 minimum
   - Format: MP4 (H.264)
   - Show: Complete workflow, emphasize speed

2. **Feature Videos** (4 videos)
   - Duration: 15-30 seconds each
   - Focus on one feature per video
   - Can be screen recordings

3. **Workflow Videos** (3 videos)
   - Duration: 15-20 seconds each
   - Show specific user actions
   - Mobile-friendly aspect ratio recommended

### Video Optimization
```bash
# Compress with ffmpeg
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -strict -2 output.mp4
```

## 🚦 Go-Live Checklist

Before deploying the new landing page:

- [ ] Update all content in `data.ts` with final copy
- [ ] Replace placeholder testimonials with real customers
- [ ] Add hero video or keep placeholder
- [ ] Test all CTAs (buttons, navigation)
- [ ] Verify mobile responsiveness
- [ ] Check page load performance
- [ ] Test video playback on different browsers
- [ ] Verify analytics tracking
- [ ] Run accessibility audit
- [ ] Spell check all content

## 🆘 Troubleshooting

### Videos not showing
1. Check video path is correct
2. Verify video file exists in `/public` directory
3. Check browser console for errors

### Sections not appearing
1. Verify section is imported in `HomeV2.tsx`
2. Check for TypeScript errors
3. Ensure data exists in `data.ts`

### Styling issues
1. Check Tailwind classes are correct
2. Verify COLORS imports
3. Clear Next.js cache: `npm run dev`

## 📚 Further Reading

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Best Practices](https://react.dev/learn)
- [Landing Page Optimization Guide](../../../LANDING_PAGE_IMPROVEMENT_SUGGESTIONS.md)

## 🤝 Contributing

When adding new features:
1. Keep components modular and reusable
2. Follow existing naming conventions
3. Update this README with your changes
4. Add TypeScript types for all props
5. Test on mobile and desktop

---

**Need help?** Refer to the main improvement document at `/LANDING_PAGE_IMPROVEMENT_SUGGESTIONS.md` for strategic guidance.
