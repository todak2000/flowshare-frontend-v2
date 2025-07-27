"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../hook/useUser";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { COLORS } from "../../../component/Home";

export default function DashboardRouter() {
  const { auth, data: userData, loading } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    if (!loading && userData?.role) {
      // Redirect to role-specific dashboard
      switch (userData.role) {
        case "field_operator":
          router.push("/dashboard/field-operator");
          break;
        case "admin":
        case "jv_coordinator":
          router.push("/dashboard/jv-coordinator");
          break;
        case "jv_partner":
          router.push("/dashboard/jv-partner");
          break;
        case "auditor":
          router.push("/dashboard/auditor");
          break;
        default:
          router.push("/onboarding/login");
      }
    }
  }, [loading, auth, userData, router]);

  if (loading) {
    return (
      <div
        className={`min-h-screen ${COLORS.background.gradient} flex flex-col items-center justify-center`}
      >
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${COLORS.background.gradient} flex flex-col items-center justify-center`}
    >
      <LoadingSpinner message="Redirecting..." />
    </div>
  );
}
