/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Database,
  Activity,
  Users,
  Droplet,
  Bell,
  Search,
  X,
  Hamburger,
  Menu,
  Sparkles,
} from "lucide-react";
import { Permission, UserRole } from "../types";
import { COLORS } from "./Home";
import { useUser } from "../hook/useUser";
import { Logo } from "./Logo";
import { firebaseService } from "../lib/firebase-service";
import { useNotifications } from "../lib/notifications-context";

// TypeScript Interfaces
interface User {
  uid: string;
  email: string;
  role: UserRole;
  company: string;
  permissions: Permission[];
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

// Navigation Items Configuration
const getNavigationItems = (
  userData: User,
  currentPath: string
): NavigationItem[] => {
  if (!userData?.role) return [];

  const baseItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Activity,
      active:
        currentPath.includes("/dashboard") &&
        currentPath.split("/").length <= 2,
    },
  ];

  const roleSpecificItems: Record<UserRole, NavigationItem[]> = {
    field_operator: [
      {
        label: "Production Data",
        href: "/production",
        icon: BarChart3,
        active: currentPath.includes("/production"),
      },
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: Sparkles,
        active: currentPath.includes("/ai-insights"),
      },
    ],
    jv_coordinator: [
      {
        label: "Production Data",
        href: "/production",
        icon: BarChart3,
        active: currentPath.includes("/production"),
      },
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: Sparkles,
        active: currentPath.includes("/ai-insights"),
      },
      {
        label: "Reconciliation",
        href: "/reconciliation",
        icon: Shield,
        active: currentPath.includes("/reconciliation"),
      },
      // {
      //   label: "Terminal Reciept",
      //   href: "/terminal",
      //   icon: Shield,
      //   active: currentPath.includes("/terminal"),
      // },
    ],
    admin: [
      {
        label: "Production Data",
        href: "/production",
        icon: BarChart3,
        active: currentPath.includes("/production"),
      },
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: Sparkles,
        active: currentPath.includes("/ai-insights"),
      },
      {
        label: "Reconciliation",
        href: "/reconciliation",
        icon: Shield,
        active: currentPath.includes("/reconciliation"),
      },
    ],
    jv_partner: [
      {
        label: "Production Data",
        href: "/production",
        icon: BarChart3,
        active: currentPath.includes("/production"),
      },
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: Sparkles,
        active: currentPath.includes("/ai-insights"),
      },
      {
        label: "Reconciliation",
        href: "/reconciliation",
        icon: Shield,
        active: currentPath.includes("/reconciliation"),
      },
    ],
    auditor: [
      {
        label: "Production Data",
        href: "/production",
        icon: BarChart3,
        active: currentPath.includes("/production"),
      },
      {
        label: "Audit Logs",
        href: "/audit",
        icon: Database,
        active: currentPath.includes("/audit"),
      },
      {
        label: "Data Integrity",
        href: "/integrity",
        icon: Shield,
        active: currentPath.includes("/integrity"),
      },
    ],
  };

  return [...baseItems, ...(roleSpecificItems[userData.role] || [])];
};

// User Menu Component
interface UserMenuProps {
  userData: User;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  onSignOut: () => void;
  router: any;
}

const UserMenu: React.FC<UserMenuProps> = ({
  userData,
  showUserMenu,
  setShowUserMenu,
  onSignOut,
  router,
}) => {
  // Keyboard navigation
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showUserMenu) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showUserMenu, setShowUserMenu]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        aria-label="User menu"
        aria-expanded={showUserMenu}
        aria-haspopup="true"
        className={`flex items-center space-x-3 cursor-pointer ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl px-4 py-2 hover:${COLORS.background.glassHover} transition-all duration-300`}
      >
      <div
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}
      >
        <span className="text-sm font-medium text-white">
          {userData?.email?.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="hidden sm:block text-left">
        <div className={`text-sm font-medium ${COLORS.text.primary}`}>
          {userData?.email?.split("@")[0]}
        </div>
        <div className={`text-xs ${COLORS.text.muted} capitalize`}>
          {userData?.role?.replace("_", " ")}
        </div>
      </div>
      <ChevronDown
        className={`w-4 h-4 cursor-pointer ${
          COLORS.text.muted
        } transition-transform duration-200 ${
          showUserMenu ? "rotate-180" : ""
        }`}
      />
    </button>

    {showUserMenu && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>

        {/* Menu */}
        <div
          role="menu"
          aria-label="User account menu"
          className={`absolute right-0 mt-2 w-64 bg-black backdrop-blur-xl ${COLORS.border.light} border rounded-2xl shadow-2xl z-50 overflow-hidden`}
        >
          {/* User Info Header */}
          <div className="p-4 border-b border-white/10" role="presentation">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}
              >
                <span className="text-lg font-medium text-white">
                  {userData?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${COLORS.text.primary} truncate`}>
                  {userData?.email}
                </div>
                <div className={`text-sm ${COLORS.text.muted} capitalize`}>
                  {userData?.role?.replace("_", " ")}
                </div>
                <div className={`text-xs ${COLORS.text.muted} truncate`}>
                  {userData?.company}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              role="menuitem"
              onClick={onSignOut}
              aria-label="Sign out of your account"
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </>
    )}
    </div>
  );
};

// Notification Bell Component
const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard navigation
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className={`w-5 h-5 ${COLORS.text.primary}`} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notifications Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className={`font-semibold ${COLORS.text.primary}`}>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-500/10' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {notification.type === 'reconciliation' ? '📊' : '📧'}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-sm mb-1 ${COLORS.text.primary}`}>
                          {notification.subject}
                        </h4>

                        {/* AI-Generated Summary */}
                        {notification.ai_summary && (
                          <div className="bg-purple-500/20 border border-purple-500/30 rounded p-2 mb-2">
                            <div className="text-xs text-purple-400 font-semibold mb-1">
                              AI Summary
                            </div>
                            <p className={`text-xs ${COLORS.text.secondary}`}>
                              {notification.ai_summary}
                            </p>
                          </div>
                        )}

                        <p className={`text-xs ${COLORS.text.muted} line-clamp-2`}>
                          {notification.message}
                        </p>

                        <div className={`text-xs ${COLORS.text.muted} mt-2`}>
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                }}
                className="text-sm text-blue-400 hover:underline"
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Navigation Item Component
interface NavItemProps {
  item: NavigationItem;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, onClick }) => {
  const IconComponent = item.icon;
  const path = usePathname();
  const isActive = path.includes(item.href);

  return (
    <button
      onClick={onClick}
      aria-label={`Navigate to ${item.label}`}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center cursor-pointer space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isActive
          ? `bg-white ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} shadow-lg`
          : `${COLORS.text.secondary} hover:${COLORS.text.primary} hover:${COLORS.background.glassHover}`
      }`}
    >
      <IconComponent className="w-4 h-4" aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
};

// Mobile Menu Component
interface MobileMenuProps {
  navigationItems: NavigationItem[];
  router: any;
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navigationItems,
  router,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Menu */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 backdrop-blur-xl ${COLORS.border.light} border-b`}
      >
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              onClose();
            }}
            className={`w-full flex items-center justify-end px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${`${COLORS.text.secondary} hover:${COLORS.background.glassHover}`}`}
          >
            <X className="w-5 h-5" />
          </button>
          {navigationItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                onClose();
              }}
              aria-label={`Navigate to ${item.label}`}
              aria-current={item.active ? 'page' : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                item.active
                  ? `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white`
                  : `${COLORS.text.secondary} hover:${COLORS.background.glassHover}`
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Main Navigation Header Component
const NavigationHeader: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const { auth, data: userData, loading } = useUser();

  const handleSignOut = async (): Promise<void> => {
    try {
      // Simulate sign out
      await firebaseService.signOut()
      localStorage.removeItem("user");
      router.push("/onboarding/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading || !auth) {
    return null;
  }

  const navigationItems = getNavigationItems(userData as User, pathname);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-30 ${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border-b`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Logo />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  onClick={() => router.push(item.href)}
                />
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Menu */}
            <UserMenu
              userData={userData as User}
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
              onSignOut={handleSignOut}
              router={router}
            />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden w-6 h-6 flex flex-col justify-center"
            >
              <Menu className="text-white" />
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        navigationItems={navigationItems}
        router={router}
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </nav>
  );
};

export default NavigationHeader;
