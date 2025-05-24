"use client"

import React from "react"
import {
  BarChart3,
  Calendar,
  UserCog,
  User,
  Building2,
  BedDouble,
  CreditCard,
  Settings2,
  FileBarChart,
  Settings,
  Menu,
  Clock,
  Server,
  FileText,
  Pill,
  Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "@/components/shared-components"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  activePage: string;
}

export function AdminLayout({ children, title, activePage }: AdminLayoutProps) {
  const { user } = useAuthProvider();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#0066CC] flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <span className="text-xl font-bold">Hospital</span>
        </div>
        <div className="mt-6">
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Dashboard"
            href="/admin/dashboard"
            active={activePage === "dashboard"}
          />
          <SidebarItem
            icon={<Calendar size={20} />}
            label="Appointments"
            href="/admin/appointments"
            active={activePage === "appointments"}
          />
          <SidebarItem
            icon={<UserCog size={20} />}
            label="Doctors"
            href="/admin/doctors"
            active={activePage === "doctors"}
          />
          <SidebarItem
            icon={<User size={20} />}
            label="Patients"
            href="/admin/patients"
            active={activePage === "patients"}
          />
          <SidebarItem
            icon={<Building2 size={20} />}
            label="Departments"
            href="/admin/departments"
            active={activePage === "departments"}
          />
          <SidebarItem
            icon={<BedDouble size={20} />}
            label="Rooms"
            href="/admin/rooms"
            active={activePage === "rooms"}
          />
          <SidebarItem
            icon={<CreditCard size={20} />}
            label="Payment"
            href="/admin/payment"
            active={activePage === "payment"}
          />
          <SidebarItem
            icon={<Settings2 size={20} />}
            label="Settings"
            href="/admin/settings"
            active={activePage === "settings"}
          />
          <SidebarItem
            icon={<FileBarChart size={20} />}
            label="Reports"
            href="/admin/reports"
            active={activePage === "reports"}
          />
          <SidebarItem
            icon={<Clock size={20} />}
            label="Login History"
            href="/admin/login-history"
            active={activePage === "login-history"}
          />
          <SidebarItem
            icon={<Server size={20} />}
            label="Microservices"
            href="/admin/microservices"
            active={activePage === "microservices"}
          />

          {/* Microservices Management */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Microservices
            </h3>
          </div>
          <SidebarItem
            icon={<FileText size={20} />}
            label="Medical Records"
            href="/admin/medical-records"
            active={activePage === "medical-records"}
          />
          <SidebarItem
            icon={<Pill size={20} />}
            label="Prescriptions"
            href="/admin/prescriptions"
            active={activePage === "prescriptions"}
          />
          <SidebarItem
            icon={<Receipt size={20} />}
            label="Billing"
            href="/admin/billing"
            active={activePage === "billing"}
          />
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Analytics Dashboard"
            href="/admin/microservices-dashboard"
            active={activePage === "microservices-dashboard"}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Hospital Management System</span>
                {user && (
                  <>
                    <span className="text-gray-400">•</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {user.role.toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                <AvatarFallback>
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <span className="font-medium">{user?.full_name || 'Admin User'}</span>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
