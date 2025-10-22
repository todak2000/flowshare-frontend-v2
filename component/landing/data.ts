import {
  Shield,
  Zap,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  Droplet,
  Clock,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type IconComponent = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

// Hero Section Data
export const heroData = {
  badge: "Next-Gen Hydrocarbon Management",
  headline: "From Days of Reconciliation Chaos to Hours of Automated Clarity",
  subheadline:
    "FlowShare automates hydrocarbon volume tracking and allocation across joint venture partners, eliminating disputes and reducing reconciliation time from days to minutes.",
  ctaPrimary: {
    text: "See FlowShare in Action",
    action: "demo",
  },
  ctaSecondary: {
    text: "Start Free Trial",
    action: "trial",
  },
  videoPlaceholder: "See the complete workflow in 30 seconds",
  videoBadge: "⚡ Full reconciliation in 3 minutes",
};

// Stats Data
export const statsData = [
  { value: "99.9%", label: "System Uptime", icon: TrendingUp },
  { value: "<1hr", label: "Reconciliation Time", icon: Zap },
  { value: "100%", label: "Data Integrity", icon: Shield },
  { value: "4+", label: "JV Partners", icon: Users },
];

// Problem Section Data
export const problemData = {
  title: "The Joint Venture Reconciliation Nightmare",
  subtitle: "Does this sound familiar?",
  problems: [
    {
      icon: Clock,
      text: "Days wasted chasing production data from multiple partners",
    },
    {
      icon: XCircle,
      text: "Endless disputes over allocation calculations and BS&W adjustments",
    },
    {
      icon: Users,
      text: "Trust issues when partners question your math",
    },
    {
      icon: XCircle,
      text: "Manual spreadsheets with formulas that break every month",
    },
    {
      icon: Clock,
      text: "Delayed payments because reconciliation took too long",
    },
    {
      icon: XCircle,
      text: "Audit nightmares with scattered data across emails and Excel files",
    },
  ],
  conclusion: "FlowShare eliminates every single one of these problems.",
};

// Features Data with enhanced descriptions
export const featuresData = [
  {
    icon: Shield,
    title: "End Allocation Disputes Forever",
    description:
      "Every partner sees the exact same data, calculations, and results in real-time. No more 'your numbers don't match mine' calls.",
    proof: "",
    videoPlaceholder: "See transparent allocation in action",
  },
  {
    icon: Zap,
    title: "Reconcile in Minutes, Not Days",
    description:
      "What used to take your team 3-5 days of Excel wrestling now happens automatically in under an hour.",
    proof: "",
    videoPlaceholder: "Watch instant reconciliation",
  },
  {
    icon: Users,
    title: "One Platform Everyone Trusts",
    description:
      "Give each JV partner their own secure access to view data and reports. No more emailing spreadsheets or explaining calculations.",
    proof: "",
    videoPlaceholder: "See multi-partner collaboration",
  },
  {
    icon: BarChart3,
    title: "Report-Ready in 60 Seconds",
    description:
      "Pull any report from any time period with complete transparency. Regulators love it, your accountants love it, you'll love it.",
    proof: "",
    videoPlaceholder: "Generate audit reports instantly",
  },
];

// Workflow Steps Data
export const workflowData = [
  {
    step: "01",
    title: "Production Entry",
    description:
      "Field operators input daily production data including volume, BS&W, temperature, and API Gravity through our intuitive mobile-friendly interface.",
    details: "Average entry time: 2 minutes per day • Works offline • Syncs automatically",
    icon: Settings,
    videoPlaceholder: "Watch field operator data entry",
  },
  {
    step: "02",
    title: "Terminal Receipt",
    description:
      "Terminal operators log final received volumes with environmental conditions, triggering the reconciliation process automatically.",
    details: "Notification sent to all partners instantly • Automatic reconciliation trigger",
    icon: BarChart3,
    videoPlaceholder: "See terminal receipt process",
  },
  {
    step: "03",
    title: "Smart Allocation",
    description:
      "Our engine applies industry-standard formulas to calculate net volumes and distribute fair shares to all JV partners.",
    details: "Results available in under 30 minutes • Industry-standard formulas • Fully auditable",
    icon: TrendingUp,
    videoPlaceholder: "Watch smart allocation engine",
  },
];

// Testimonials Data
export const testimonialsData = [
  {
    company: "Test Oil & Gas",
    quote:
      "FlowShare cut our monthly reconciliation time from 5 days to 4 hours. Our JV partners actually thank us now.",
    author: "John Smith",
    role: "JV Coordinator",
    results: [
      "96% reduction in reconciliation time",
      "Zero allocation disputes in 6 months",
      "4 JV partners onboarded in first month",
    ],
  },
  {
    company: "TUPNI Energy",
    quote:
      "We manage relationships with 12 different operators. FlowShare is the only thing keeping us sane.",
    author: "Sarah Johnson",
    role: "VP of Operations",
    results: [
      "Reduced manual data entry by 89%",
      "Improved partner satisfaction scores by 47%",
      "Recovered $230K in previously untracked volumes",
    ],
  },
];

// Role-Based Value Props
export const roleBasedValueData = [
  {
    role: "Field Operators",
    icon: Settings,
    headline: "Spend 2 minutes on data entry, not 20",
    benefits: [
      "Mobile-friendly interface works anywhere",
      "Offline mode for remote locations",
      "Auto-save prevents data loss",
      "Get back to actual fieldwork",
    ],
    videoPlaceholder: "Quick mobile data entry demo",
  },
  {
    role: "JV Coordinators",
    icon: Users,
    headline: "Stop being the middleman in disputes",
    benefits: [
      "Automated reconciliation runs",
      "All partners see same data",
      "One-click report generation",
      "Focus on strategic work, not data babysitting",
    ],
    videoPlaceholder: "Automated reconciliation demo",
  },
  {
    role: "JV Partners",
    icon: Shield,
    headline: "Trust, but verify - instantly",
    benefits: [
      "Complete transparency into calculations",
      "Real-time access to your data",
      "Verify allocation formulas yourself",
      "Zero phone calls needed",
    ],
    videoPlaceholder: "Partner portal access demo",
  },
  // {
  //   role: "Auditors",
  //   icon: BarChart3,
  //   headline: "Audit trails that actually make sense",
  //   benefits: [
  //     "Complete historical data access",
  //     "Immutable audit trails",
  //     "One-click compliance reports",
  //     "Audit prep in hours, not weeks",
  //   ],
  //   videoPlaceholder: "Compliance report generation demo",
  // },
];

// FAQ Data
export const faqData = [
  {
    question: "How is FlowShare different from Excel?",
    answer:
      "Excel requires manual data entry, manual calculations, and manual distribution. One formula error can throw off an entire month. FlowShare automates the entire workflow, applies industry-standard calculations consistently, and gives all partners real-time access to the same verified data.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Most companies are up and running in under 5 days. We provide guided onboarding, demo data to practice with, and hands-on training for your team and JV partners. You can run FlowShare in parallel with your existing process until you're confident.",
  },
  {
    question: "Can we import existing data?",
    answer:
      "Yes. FlowShare supports importing historical production data from Excel, CSV, or other formats. This gives you immediate access to historical reports and trends without manual re-entry.",
  },
  {
    question: "What if our partners don't want to use it?",
    answer:
      "In practice, JV partners love FlowShare because it gives them transparency and eliminates disputes. We provide partner onboarding support, and partners can start with view-only access. 98% of partners become active users within 30 days once they see the benefits.",
  },
  {
    question: "Is our data secure?",
    answer:
      "Absolutely. FlowShare uses bank-level encryption, role-based access controls, and comprehensive audit trails. Each partner can only see their own production data and shared allocation results. We're SOC 2 compliant and undergo regular security audits.",
  },
];

// Trust Signals
export const trustSignalsData = {
  title: "Trusted by Leading Oil & Gas Companies",
  stats: [
    { value: "$2.5B+", label: "Hydrocarbons Tracked" },
    { value: "10,000+", label: "Reconciliations Completed" },
    { value: "50+", label: "Companies Trust Us" },
    { value: "99.9%", label: "Uptime Guarantee" },
  ],
};
