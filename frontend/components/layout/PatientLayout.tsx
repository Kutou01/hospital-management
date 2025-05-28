'use client';

import React, { useState } from 'react';
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context';
import { SidebarItem } from '@/components/shared-components';
import { UserMenu } from './UserMenu';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  Activity,
  CreditCard,
  Settings,
  Menu,
  Heart,
  ClipboardList,
  Phone,
  MessageCircle
} from 'lucide-react';

interface PatientLayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({
  children,
  title,
  activePage,
}) => {
  const { user, signOut } = useEnhancedAuth();
  const logout = () => signOut();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-64 hidden lg:block'
      }`}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Patient Portal</h1>
              <p className="text-sm text-gray-600">Hospital Management</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            href="/patient/dashboard"
            active={activePage === "dashboard"}
          />

          {/* Appointments & Care */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              My Care
            </h3>
          </div>
          <SidebarItem
            icon={<Calendar size={20} />}
            label="Appointments"
            href="/patient/appointments"
            active={activePage === "appointments"}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Medical Records"
            href="/patient/medical-records"
            active={activePage === "medical-records"}
          />
          <SidebarItem
            icon={<Pill size={20} />}
            label="Prescriptions"
            href="/patient/prescriptions"
            active={activePage === "prescriptions"}
          />
          <SidebarItem
            icon={<Activity size={20} />}
            label="Lab Results"
            href="/patient/lab-results"
            active={activePage === "lab-results"}
          />

          {/* Billing & Payments */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Billing
            </h3>
          </div>
          <SidebarItem
            icon={<CreditCard size={20} />}
            label="Bills & Payments"
            href="/patient/billing"
            active={activePage === "billing"}
          />

          {/* Communication */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Communication
            </h3>
          </div>
          <SidebarItem
            icon={<MessageCircle size={20} />}
            label="Messages"
            href="/patient/messages"
            active={activePage === "messages"}
          />
          <SidebarItem
            icon={<Phone size={20} />}
            label="Contact Support"
            href="/patient/support"
            active={activePage === "support"}
          />

          {/* Reports & Settings */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Account
            </h3>
          </div>
          <SidebarItem
            icon={<ClipboardList size={20} />}
            label="Health Summary"
            href="/patient/health-summary"
            active={activePage === "health-summary"}
          />
          <SidebarItem
            icon={<Settings size={20} />}
            label="Settings"
            href="/patient/settings"
            active={activePage === "settings"}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Heart className="h-4 w-4" />
                  <span>{user?.full_name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
            <UserMenu user={user} onLogout={logout} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
