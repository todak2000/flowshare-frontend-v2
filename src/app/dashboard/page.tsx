'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../hook/useUser';
import LoadingSpinner from '../../../component/LoadingSpinner';

export default function DashboardRouter() {
  const { auth, data: userData, loading } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !auth) {
      router.push('/onboarding/login');
      return;
    }

    if (!loading && userData?.role) {
      // Redirect to role-specific dashboard
      switch (userData.role) {
        case 'field_operator':
          router.push('/dashboard/field-operator');
          break;
        case 'admin':
        case 'jv_coordinator':
          router.push('/dashboard/jv-coordinator');
          break;
        case 'jv_partner':
          router.push('/dashboard/jv-partner');
          break;
        case 'auditor':
          router.push('/dashboard/auditor');
          break;
        default:
          router.push('/onboarding/login');
      }
    }
  }, [loading, auth, userData, router]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return <LoadingSpinner fullScreen message="Redirecting..." />;
}