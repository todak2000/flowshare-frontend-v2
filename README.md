# FlowShare: Next-Gen Hydrocarbon Management

**Live Demo:** [https://hydrochain.vercel.app/onboarding/login](https://hydrochain.vercel.app/onboarding/login)

FlowShare is a modern, full-stack web application designed to revolutionize hydrocarbon allocation and reconciliation for joint venture (JV) partners in the oil and gas industry. It provides a transparent, real-time platform for tracking hydrocarbon volumes, automating complex calculations, and ensuring fair and auditable distribution of assets.

## Key Features

*   **Secure User Authentication:** Role-based access control for different stakeholders (Field Operators, JV Coordinators, JV Partners, Auditors).
*   **Real-time Data Entry:** Field operators can input daily production data, including gross volume, BS&W, temperature, and API gravity.
*   **Automated Allocation Engine:** Implements industry-standard calculations (API MPMS) to determine net volumes and allocate them proportionally among partners.
*   **Instant Reconciliation:** Drastically reduces the time for reconciliation from days to minutes.
*   **Data Integrity:** Uses SHA-256 hashing to ensure the integrity and immutability of all records, creating a verifiable audit trail.
*   **Interactive Dashboards:** Provides stakeholders with customized views and analytics to monitor production, allocation, and performance.
*   **Comprehensive Reporting:** Generate detailed reports for compliance and auditing purposes.
*   **Demo Mode:** A sandbox environment to explore the platform's features with pre-populated data.

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (with Turbopack)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Charting:** [Recharts](https://recharts.org/)
*   **Deployment:** [Vercel](https://vercel.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   Yarn, npm, or pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd frontend
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
4.  **Set up Firebase:**
    *   Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    *   Enable Authentication (Email/Password) and Firestore.
    *   Get your Firebase project configuration and add it to the project. You'll likely need to create a `.env.local` file with your Firebase credentials.
    *   The application uses Firebase Admin SDK, so you will also need to set up a service account.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The codebase is organized into several key directories:

```
/
├── component/        # Reusable React components
├── constants/        # Global constants
├── hook/             # Custom React hooks
├── lib/              # Core application logic and services
│   ├── allocation-engine.ts # The brain of the application
│   └── firebase-service.ts  # Firebase interaction logic
├── public/           # Static assets
├── src/app/          # Next.js App Router, pages and layouts
│   ├── dashboard/    # Dashboards for different user roles
│   ├── onboarding/   # Login and registration pages
│   └── ...
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Core Logic: The Allocation Engine

The heart of FlowShare is the `lib/allocation-engine.ts`. This engine is responsible for:

1.  **Calculating Net Volume:** It takes gross production volume and corrects it for water content (BS&W), temperature, and API gravity to determine the net standard volume.
2.  **Calculating Shrinkage:** It compares the total net volume from all field entries to the final volume measured at the terminal to calculate a shrinkage factor.
3.  **Allocating Terminal Volume:** It proportionally allocates the final terminal volume to each partner based on their contribution of net volume.
4.  **Ensuring Data Integrity:** It generates a unique hash for each transaction and report, making the data tamper-proof and fully auditable.

## User Roles

FlowShare is designed for multiple stakeholders in the JV process:

*   **Field Operator:** Enters the daily production data from the well sites.
*   **JV Coordinator:** Oversees the process, manages the data, and initiates the reconciliation process.
*   **JV Partner:** Views their allocated volumes and the overall reconciliation results.
*   **Auditor:** Has read-only access to all data for compliance and verification purposes.
