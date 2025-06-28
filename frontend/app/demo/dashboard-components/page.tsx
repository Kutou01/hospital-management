"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Calendar,
  Heart,
  Activity,
  TrendingUp,
  Clock,
  Stethoscope,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

// Import our enhanced components
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard"
import { RealTimeStatsEnhanced } from "@/components/dashboard/RealTimeStatsEnhanced"
import { InteractiveCalendar } from "@/components/dashboard/InteractiveCalendar"
import { ChartCard, BarChartGroup, ProgressChart, MetricComparison } from "@/components/dashboard/ChartCard"
import { ActivityTimeline, CompactActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { NotificationCenter, NotificationBell } from "@/components/dashboard/NotificationCenter"
import {
  StatCardSkeleton,
  ChartCardSkeleton,
  CalendarSkeleton,
  ActivityTimelineSkeleton,
  NotificationCenterSkeleton,
  RealTimeStatsSkeleton,
  DashboardGridSkeleton,
  PulseWrapper
} from "@/components/dashboard/SkeletonLoaders"
import { useDashboardLoading } from "@/hooks/useProgressiveLoading"

export default function DashboardComponentsDemo() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showSkeletons, setShowSkeletons] = useState(false)

  // Progressive loading demo
  const {
    isStatsLoading,
    isChartsLoading,
    isCalendarLoading,
    isActivitiesLoading,
    isNotificationsLoading,
    isSystemStatsLoading,
    progress
  } = useDashboardLoading()

  // Mock data
  const mockEvents = [
    {
      id: '1',
      title: 'Khám tổng quát - Nguyễn Văn A',
      date: new Date(),
      time: '09:00',
      type: 'appointment' as const,
      patient: 'Nguyễn Văn A',
      doctor: 'BS. Trần Thị B',
      location: 'Phòng 101',
      status: 'confirmed' as const
    },
    {
      id: '2',
      title: 'Phẫu thuật tim',
      date: new Date(),
      time: '14:00',
      type: 'surgery' as const,
      patient: 'Lê Thị C',
      doctor: 'BS. Nguyễn Văn D',
      location: 'Phòng mổ 1',
      status: 'pending' as const
    }
  ]

  const mockMetrics = {
    activeUsers: 45,
    serverLoad: 68,
    databaseConnections: 12,
    responseTime: 245,
    memoryUsage: 72,
    diskUsage: 45,
    networkLatency: 23,
    uptime: '15d 4h 23m'
  }

  const progressData = [
    { label: 'Bệnh nhân hôm nay', value: 85, color: 'blue', target: 100 },
    { label: 'Cuộc hẹn hoàn thành', value: 92, color: 'green', target: 100 },
    { label: 'Phòng đang sử dụng', value: 78, color: 'orange', target: 100 },
    { label: 'Bác sĩ trực', value: 95, color: 'purple', target: 100 }
  ]

  const mockActivities = [
    {
      id: '1',
      type: 'appointment' as const,
      title: 'Cuộc hẹn với BS. Nguyễn Văn A',
      description: 'Khám tổng quát định kỳ',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      user: { name: 'Nguyễn Văn A', role: 'Bác sĩ', avatar: '' },
      patient: { name: 'Trần Thị B', id: 'PAT-202401-001' },
      status: 'completed' as const,
      priority: 'medium' as const
    },
    {
      id: '2',
      type: 'surgery' as const,
      title: 'Phẫu thuật tim',
      description: 'Phẫu thuật bypass động mạch vành',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      user: { name: 'Lê Văn C', role: 'Phẫu thuật viên', avatar: '' },
      patient: { name: 'Phạm Văn D', id: 'PAT-202401-002' },
      status: 'in-progress' as const,
      priority: 'urgent' as const
    },
    {
      id: '3',
      type: 'test' as const,
      title: 'Kết quả xét nghiệm',
      description: 'Xét nghiệm máu tổng quát',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      user: { name: 'Hoàng Thị E', role: 'Kỹ thuật viên', avatar: '' },
      patient: { name: 'Vũ Thị F', id: 'PAT-202401-003' },
      status: 'completed' as const,
      priority: 'low' as const
    }
  ]

  const mockNotifications = [
    {
      id: '1',
      type: 'emergency' as const,
      title: 'Cấp cứu khẩn cấp',
      message: 'Bệnh nhân cần cấp cứu ngay lập tức tại phòng 205',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isRead: false,
      priority: 'urgent' as const,
      sender: { name: 'Y tá trưởng', role: 'Điều dưỡng', avatar: '' }
    },
    {
      id: '2',
      type: 'appointment' as const,
      title: 'Cuộc hẹn mới',
      message: 'Bệnh nhân Nguyễn Văn A đã đặt lịch hẹn lúc 14:00',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isRead: false,
      priority: 'medium' as const,
      sender: { name: 'Lễ tân', role: 'Tiếp tân', avatar: '' }
    },
    {
      id: '3',
      type: 'system' as const,
      title: 'Cập nhật hệ thống',
      message: 'Hệ thống sẽ được bảo trì từ 23:00 đến 01:00',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true,
      priority: 'low' as const,
      sender: { name: 'Quản trị viên', role: 'IT', avatar: '' }
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Enhanced Dashboard Components Demo
          </h1>
          <p className="text-gray-600">
            Showcase các component dashboard được cải tiến cho Hospital Management System
          </p>

          {/* Demo Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant={showSkeletons ? "default" : "outline"}
              onClick={() => setShowSkeletons(!showSkeletons)}
            >
              {showSkeletons ? "Hide" : "Show"} Skeleton Loading
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Progressive Loading:</span>
              <Progress value={progress} className="w-32 h-2" />
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Skeleton Loading Demo */}
        {showSkeletons && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">💀 Skeleton Loading Demo</h2>
            <DashboardGridSkeleton />
          </section>
        )}

        {/* Enhanced Stat Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📊 Enhanced Stat Cards</h2>
          
          {/* Different Variants */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
              <EnhancedStatCard
              title="Tổng bệnh nhân"
              value={1247}
              change={12.5}
              changeLabel="so với tháng trước"
              icon={<Users className="h-6 w-6" />}
              description="156 bệnh nhân mới tuần này"
              color="blue"
              variant="gradient"
              showTrend={true}
              showActions={true}
              onRefresh={() => console.log('Refreshing...')}
              onViewDetails={() => console.log('View details...')}
              />
            </PulseWrapper>

            <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
              <EnhancedStatCard
              title="Cuộc hẹn hôm nay"
              value={89}
              change={-5.2}
              changeLabel="so với hôm qua"
              icon={<Calendar className="h-6 w-6" />}
              description="12 cuộc hẹn đang chờ"
              color="green"
              variant="minimal"
              status="warning"
              showProgress={true}
              progressValue={89}
              progressMax={120}
              />
            </PulseWrapper>

            <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
              <EnhancedStatCard
              title="Phẫu thuật"
              value={15}
              subtitle="Hôm nay"
              icon={<Activity className="h-6 w-6" />}
              description="3 ca cấp cứu"
              color="red"
              variant="outlined"
              status="critical"
              size="md"
              />
            </PulseWrapper>

            <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
              <EnhancedStatCard
              title="Doanh thu"
              value="2.4M"
              change={18.7}
              changeLabel="tăng trưởng"
              icon={<TrendingUp className="h-6 w-6" />}
              description="VNĐ trong tháng"
              color="purple"
              variant="gradient"
              size="lg"
              />
            </PulseWrapper>
          </div>

          {/* Different Sizes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnhancedStatCard
              title="Small Size"
              value={42}
              icon={<Heart className="h-4 w-4" />}
              color="red"
              size="sm"
            />
            <EnhancedStatCard
              title="Medium Size"
              value={156}
              icon={<Stethoscope className="h-5 w-5" />}
              color="blue"
              size="md"
            />
            <EnhancedStatCard
              title="Large Size"
              value={789}
              icon={<FileText className="h-6 w-6" />}
              color="green"
              size="lg"
            />
          </div>
        </section>

        {/* Real-time Stats Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">⚡ Real-time System Stats</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeStatsEnhanced
              systemHealth="healthy"
              metrics={mockMetrics}
              showDetailedMetrics={false}
              onRefresh={() => console.log('Refreshing system stats...')}
            />
            
            <RealTimeStatsEnhanced
              systemHealth="warning"
              metrics={{
                ...mockMetrics,
                serverLoad: 85,
                memoryUsage: 92
              }}
              showDetailedMetrics={true}
              onRefresh={() => console.log('Refreshing detailed stats...')}
            />
          </div>
        </section>

        {/* Interactive Calendar Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📅 Interactive Calendar</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveCalendar
              events={mockEvents}
              onDateSelect={setSelectedDate}
              onEventClick={(event) => console.log('Event clicked:', event)}
              onAddEvent={(date) => console.log('Add event for:', date)}
              showMiniCalendar={true}
              showEventList={false}
            />
            
            <InteractiveCalendar
              events={mockEvents}
              onDateSelect={setSelectedDate}
              onEventClick={(event) => console.log('Event clicked:', event)}
              onAddEvent={(date) => console.log('Add event for:', date)}
              showMiniCalendar={false}
              showEventList={true}
            />
          </div>
        </section>

        {/* Enhanced Charts Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📈 Enhanced Charts</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Thống kê bệnh nhân"
              subtitle="Theo tuần"
              chartType="bar"
              showExport={true}
              onExport={() => console.log('Exporting chart...')}
              onRefresh={() => console.log('Refreshing chart...')}
              trend={{
                value: 12.5,
                label: 'tăng',
                direction: 'up'
              }}
            >
              <div className="flex justify-around items-end h-32">
                <BarChartGroup label="T2" value1={45} value2={38} showValues={true} />
                <BarChartGroup label="T3" value1={52} value2={41} showValues={true} />
                <BarChartGroup label="T4" value1={38} value2={35} showValues={true} />
                <BarChartGroup label="T5" value1={61} value2={48} showValues={true} />
                <BarChartGroup label="T6" value1={55} value2={42} showValues={true} />
                <BarChartGroup label="T7" value1={47} value2={39} showValues={true} />
                <BarChartGroup label="CN" value1={33} value2={28} showValues={true} />
              </div>
            </ChartCard>

            <ChartCard
              title="Hiệu suất khoa"
              subtitle="Tỷ lệ hoàn thành"
              chartType="line"
            >
              <ProgressChart data={progressData} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <MetricComparison
                  title="Doanh thu tháng"
                  current={2400000}
                  previous={2100000}
                  format="currency"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <MetricComparison
                  title="Tỷ lệ hài lòng"
                  current={94.5}
                  previous={91.2}
                  format="percentage"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <MetricComparison
                  title="Thời gian chờ TB"
                  current={15}
                  previous={18}
                  unit=" phút"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Activity Timeline Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📋 Activity Timeline</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityTimeline
              activities={mockActivities}
              onActivityClick={(activity) => console.log('Activity clicked:', activity)}
              onAddActivity={() => console.log('Add new activity')}
              showFilters={true}
              showSearch={true}
              groupByDate={true}
            />

            <CompactActivityTimeline
              activities={mockActivities}
              maxItems={3}
            />
          </div>
        </section>

        {/* Notification Center Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">🔔 Notification Center</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NotificationCenter
                notifications={mockNotifications}
                onNotificationClick={(notification) => console.log('Notification clicked:', notification)}
                onMarkAsRead={(id) => console.log('Mark as read:', id)}
                onMarkAllAsRead={() => console.log('Mark all as read')}
                onDeleteNotification={(id) => console.log('Delete notification:', id)}
                onClearAll={() => console.log('Clear all notifications')}
                showFilters={true}
                showSearch={true}
                groupByType={false}
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Bell</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <NotificationBell
                      notifications={mockNotifications}
                      onNotificationClick={(notification) => console.log('Bell notification:', notification)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unread:</span>
                      <span className="font-semibold text-red-600">
                        {mockNotifications.filter(n => !n.isRead).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Urgent:</span>
                      <span className="font-semibold text-orange-600">
                        {mockNotifications.filter(n => n.priority === 'urgent').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-semibold text-blue-600">
                        {mockNotifications.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Status Indicators */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">🚦 Status Indicators</h2>

          <div className="flex flex-wrap gap-4">
            <Badge className="bg-green-100 text-green-800 border-green-200 border flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              System Healthy
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Warning
            </Badge>
            <Badge className="bg-red-100 text-red-800 border-red-200 border flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Critical
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 border flex items-center gap-1">
              <Clock className="h-3 w-3" />
              In Progress
            </Badge>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            ✨ Enhanced Dashboard Components - Ready for Hospital Management System
          </p>
        </div>
      </div>
    </div>
  )
}
