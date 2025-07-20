// component/NavigationHeader.tsx
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../hook/useUser';
import { firebaseService } from '../lib/firebase-service';

export default function NavigationHeader() {
  const { auth, data: userData, loading } = useUser();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      localStorage.removeItem('user');
      router.push('/onboarding/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getNavigationItems = () => {
    if (!userData?.role) return [];

    const baseItems = [
      { label: 'Dashboard', href: '/dashboard' },
    ];

    switch (userData.role) {
      case 'field_operator':
        return [
          ...baseItems,
          { label: 'Production Data', href: '/production' },
        ];
      case 'jv_coordinator':
      case 'admin':
        return [
          ...baseItems,
          { label: 'Production Data', href: '/production' },
          { label: 'Terminal Receipts', href: '/terminal' },
          { label: 'Reconciliation', href: '/reconciliation' },
        ];
      case 'jv_partner':
        return [
          ...baseItems,
          { label: 'My Allocations', href: '/allocations' },
          { label: 'Production Data', href: '/production' },
        ];
      case 'auditor':
        return [
          ...baseItems,
          { label: 'Production Data', href: '/production' },
          { label: 'Audit Logs', href: '/audit' },
          { label: 'Data Integrity', href: '/integrity' },
        ];
      default:
        return baseItems;
    }
  };

  if (loading || !auth) {
    return null;
  }

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">
                OilGas Allocation
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative ml-3">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {userData?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>

              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <div className="font-medium">{userData?.email}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {userData?.role?.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">{userData?.company}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/settings');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}