"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Activity,
  Calendar,
  Users,
  Settings,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"

export default function AdminDashboard() {
  const [currentMonth, setCurrentMonth] = useState("July 2023")

  // Mock data cho admin dashboard
  const recentActivities = [
    {
      id: "1",
      type: "appointment" as const,
      title: "New appointment scheduled",
      description: "Dr. Smith with patient John Doe",
      time: "2 hours ago",
      status: "pending" as const,
      initials: "JS"
    },
    {
      id: "2",
      type: "doctor" as const,
      title: "New doctor registered",
      description: "Dr. Jane Wilson joined Cardiology",
      time: "4 hours ago",
      status: "completed" as const,
      initials: "JW"
    },
    {
      id: "3",
      type: "patient" as const,
      title: "Patient discharged",
      description: "Mary Johnson completed treatment",
      time: "1 day ago",
      status: "completed" as const,
      initials: "MJ"
    }
  ]

  return (
    <DashboardLayout title="Admin Dashboard" activePage="dashboard">
      {/* Month selector */}
      <div className="mb-6 flex items-center space-x-2">
        <div className="text-sm text-gray-500 flex items-center">
          {currentMonth}
          <ChevronDown size={16} className="ml-1" />
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Invoices" value="1,287" change={2.1} icon={<FileText className="text-blue-500" />} />
        <StatCard title="Total Patients" value="965" change={3.7} icon={<Users className="text-green-500" />} />
        <StatCard title="Appointments" value="128" change={-1.5} icon={<Calendar className="text-red-500" />} />
        <StatCard title="Revenue" value="$315K" change={18} icon={<Activity className="text-purple-500" />} />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Calendar */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{currentMonth}</h3>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {[
                  9, 1, 2, 3, 4, 5, 6, 7, 5, 5, 10, 11, 12, 13, 14, 15, 10,
                  { day: 14, current: true }, 13, 19, 30, 21, 22, 23, 24, 25, 20, 27, 28, 29, 30, 31,
                ].map((day, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-sm
                    ${typeof day === "object" && day.current ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                  >
                    {typeof day === "object" ? day.day : day}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Overview */}
        <ChartCard
          title="Patient Overview"
          className="col-span-2"
          actions={
            <Button variant="outline" className="text-sm">
              Last 8 Days <ChevronRight size={16} className="ml-1" />
            </Button>
          }
        >
          <div className="h-64 flex items-end justify-between">
            <BarChartGroup label="Child" value1={60} value2={40} />
            <BarChartGroup label="Adv" value1={80} value2={50} />
            <BarChartGroup label="Adult" value1={90} value2={60} />
            <BarChartGroup label="Elderly" value1={85} value2={55} />
            <BarChartGroup label="260+" value1={75} value2={45} />
            <BarChartGroup label="All" value1={70} value2={40} />
          </div>
        </ChartCard>
      </div>

          {/* Revenue Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <Card className="col-span-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">Revenue</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-sm">
                      Week
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm bg-gray-100">
                      Month
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Income</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Expense</span>
                  </div>
                </div>
                <div className="h-64 mt-4 relative">
                  {/* Placeholder for line chart */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Revenue Chart Visualization
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Week
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Month
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Yar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Max
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Year
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium">Schedule</h3>
                  <Badge variant="outline" className="text-xs">
                    0 / 4
                  </Badge>
                </div>
                <div className="p-0">
                  <ScheduleItem title="Morning Staff Meeting" time="08:50" subtitle="$6.50" bgColor="bg-green-50" />
                  <ScheduleItem
                    title="Patient Consultation:"
                    subtitle="@eneel Check Up"
                    time="09:00"
                    subtitleLine2="46.50"
                    bgColor="bg-blue-50"
                  />
                  <ScheduleItem
                    title="Surgery"
                    subtitle="@campriate"
                    time="11:00"
                    subtitleLine2="11.90"
                    bgColor="bg-orange-50"
                  />
                  <ScheduleItem title="Training Session" subtitle="18.00" time="12:00" bgColor="bg-teal-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Patient Overview Donut */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-6">Patient Overview</h3>
                <div className="flex justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">1,287</div>
                        <div className="text-sm text-blue-500">↑ 3.81%</div>
                      </div>
                    </div>
                    {/* Placeholder for donut chart */}
                    <div className="absolute inset-0 border-8 border-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Child</span>
                    <span>55%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elderly</span>
                    <span>28%</span>
                  </div>
                  <div className="flex justify-between">
                    <span></span>
                    <span>15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctors' Schedule */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">Doctors' Schedule</h3>
                  <Button variant="link" className="text-blue-500 p-0">
                    Avisulice <ChevronRight size={16} />
                  </Button>
                </div>
                <div className="space-y-4">
                  <DoctorSchedule name="Dr. Ava Mullins" available={true} time="07:00-18:00" />
                  <DoctorSchedule name="Dr. Andrew Karlin" available={false} />
                  <DoctorSchedule name="Dr. Ethan Jones" available={true} time="12:00-18:00" />
                  <DoctorSchedule name="Dr. Chloe Harrington" available={true} time="12:00-18:00" />
                </div>
              </CardContent>
            </Card>

            {/* Report */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-6">Report</h3>
                <div className="space-y-4">
                  <ReportItem icon={<FileText className="text-blue-500" />} title="Room Cleaning Needed" count={1} />
                  <ReportItem icon={<Settings className="text-green-500" />} title="Equipment Maintenance" count={3} />
                  <ReportItem icon={<Activity className="text-orange-500" />} title="Medication Restock" count={22} />
                  <ReportItem
                    icon={<Users className="text-purple-500" />}
                    title="Patient Transport Required"
                    count={null}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Appointment Table */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium">Patient Appointment</h3>
                <div className="flex items-center text-blue-500">
                  <span>19 Jul</span>
                  <ChevronRight size={16} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Tom</th>
                      <th className="p-4 font-medium">Time</th>
                      <th className="p-4 font-medium">Doctor</th>
                      <th className="p-4 font-medium">Treatment</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">Carol C-Simpson</td>
                      <td className="p-4">19 Jul 2023</td>
                      <td className="p-4">99:00</td>
                      <td className="p-4">12:00</td>
                      <td className="p-4">Dr. Ava Mullins</td>
                      <td className="p-4">Routine Check-Up</td>
                      <td className="p-4">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4">Steven Bennett</td>
                      <td className="p-4">19 Jul 2022</td>
                      <td className="p-4">10:50</td>
                      <td className="p-4">18:50</td>
                      <td className="p-4">Dr. Andrew Karin</td>
                      <td className="p-4">Cardiac Evaluation</td>
                      <td className="p-4">
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

      {/* Recent Activity */}
      <div className="mt-6">
        <RecentActivity
          activities={recentActivities}
          title="Recent Activity"
          maxItems={5}
        />
      </div>
    </DashboardLayout>
  )
}





// Component for schedule items
function ScheduleItem({ title, subtitle, time, subtitleLine2, bgColor }) {
  return (
    <div className={`p-4 border-b border-gray-100 ${bgColor}`}>
      <div className="flex justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-600">{subtitle}</p>
          {subtitleLine2 && <p className="text-sm text-gray-600">{subtitleLine2}</p>}
        </div>
        <div className="text-right">
          <span className="text-sm font-medium">{time}</span>
        </div>
      </div>
    </div>
  )
}

// Component for doctor schedule
function DoctorSchedule({ name, available, time }) {
  return (
    <div className="flex items-center space-x-3">
      <Avatar>
        <AvatarFallback>
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className={`text-sm ${available ? "text-green-600" : "text-red-600"}`}>
          {available ? "Available" : "Unavailable"}
          {time && <span className="text-gray-500 ml-1">{time}</span>}
        </p>
      </div>
    </div>
  )
}

// Component for report items
function ReportItem({ icon, title, count }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
        <span className="font-medium">{title}</span>
      </div>
      {count !== null && (
        <Badge variant="outline" className="font-bold">
          {count}
        </Badge>
      )}
    </div>
  )
}


