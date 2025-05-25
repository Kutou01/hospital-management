'use client';

import React, { useState } from 'react';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { SidebarItem } from '@/components/shared-components';
import { UserMenu } from './UserMenu';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Pill,
  Activity,
  Clock,
  Settings,
  Menu,
  Stethoscope,
  ClipboardList,
  TestTube
} from 'lucide-react';

interface DoctorLayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
}

export const DoctorLayout: React.FC<DoctorLayoutProps> = ({
  children,
  title,
  activePage,
}) => {
  const { user, logout } = useAuthProvider();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-64 hidden lg:block'
      }`}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Stethoscope className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Doctor Portal</h1>
              <p className="text-sm text-gray-600">Hospital Management</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            href="/doctor/dashboard"
            active={activePage === "dashboard"}
          />

          {/* Patient Management */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Patient Care
            </h3>
          </div>
          <SidebarItem
            icon={<Users size={20} />}
            label="My Patients"
            href="/doctor/patients"
            active={activePage === "patients"}
          />
          <SidebarItem
            icon={<Calendar size={20} />}
            label="Appointments"
            href="/doctor/appointments"
            active={activePage === "appointments"}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Medical Records"
            href="/doctor/medical-records"
            active={activePage === "medical-records"}
          />

          {/* Clinical Tools */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Clinical Tools
            </h3>
          </div>
          <SidebarItem
            icon={<Pill size={20} />}
            label="Prescriptions"
            href="/doctor/prescriptions"
            active={activePage === "prescriptions"}
          />
          <SidebarItem
            icon={<TestTube size={20} />}
            label="Lab Results"
            href="/doctor/lab-results"
            active={activePage === "lab-results"}
          />
          <SidebarItem
            icon={<Activity size={20} />}
            label="Vital Signs"
            href="/doctor/vital-signs"
            active={activePage === "vital-signs"}
          />

          {/* Schedule & Reports */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Schedule & Reports
            </h3>
          </div>
          <SidebarItem
            icon={<Clock size={20} />}
            label="My Schedule"
            href="/doctor/schedule"
            active={activePage === "schedule"}
          />
          <SidebarItem
            icon={<ClipboardList size={20} />}
            label="Reports"
            href="/doctor/reports"
            active={activePage === "reports"}
          />

          {/* Settings */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Account
            </h3>
          </div>
          <SidebarItem
            icon={<Settings size={20} />}
            label="Settings"
            href="/doctor/settings"
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
                  <Stethoscope className="h-4 w-4" />
                  <span>Dr. {user?.full_name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize">{user?.role}</span>
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
