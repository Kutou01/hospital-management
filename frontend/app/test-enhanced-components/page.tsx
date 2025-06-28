"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  Heart,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Star,
  Pill
} from "lucide-react"

// Import enhanced components
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard"
import { RealTimeStatsEnhanced } from "@/components/dashboard/RealTimeStatsEnhanced"
import { InteractiveCalendar } from "@/components/dashboard/InteractiveCalendar"
import { ChartCard, ProgressChart, MetricComparison } from "@/components/dashboard/ChartCard"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { NotificationCenter } from "@/components/dashboard/NotificationCenter"
import { StatCardSkeleton, ChartCardSkeleton, PulseWrapper } from "@/components/dashboard/SkeletonLoaders"
import { useDashboardLoading } from "@/hooks/useProgressiveLoading"

export default function TestEnhancedComponents() {
  const [showSkeletons, setShowSkeletons] = useState(false)
  
  // Progressive loading
  const {
    isStatsLoading,
    isChartsLoading,
    isCalendarLoading,
    isActivitiesLoading,
    isNotificationsLoading,
    progress
  } = useDashboardLoading()

  // Mock data
  const mockNotifications = [
    {
      id: '1',
      type: 'info' as const,
      title: 'Test Notification',
      message: 'This is a test notification message',
      timestamp: new Date(),
      isRead: false,
      priority: 'medium' as const,
      sender: { name: 'System', role: 'Admin', avatar: '' }
    }
  ]

  const mockActivities = [
    {
      id: '1',
      type: 'appointment' as const,
      title: 'Test Activity',
      description: 'This is a test activity',
      timestamp: new Date(),
      user: { name: 'Test User', role: 'Doctor', avatar: '' },
      patient: { name: 'Test Patient', id: 'PAT-001' },
      status: 'completed' as const,
      priority: 'medium' as const
    }
  ]

  const mockEvents = [
    {
      id: '1',
      title: 'Test Event',
      date: new Date(),
      time: '14:00',
      type: 'appointment' as const,
      status: 'confirmed' as const
    }
  ]

  const progressData = [
    { label: 'Test Metric 1', value: 85, color: 'blue', target: 100 },
    { label: 'Test Metric 2', value: 92, color: 'green', target: 100 },
    { label: 'Test Metric 3', value: 78, color: 'orange', target: 100 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🧪 Enhanced Components Test Page
          </h1>
          <p className="text-gray-600">
            Test all enhanced dashboard components for errors and functionality
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              variant={showSkeletons ? "default" : "outline"}
              onClick={() => setShowSkeletons(!showSkeletons)}
            >
              {showSkeletons ? "Hide" : "Show"} Skeleton Loading
            </Button>
            <Badge variant="outline">Progress: {Math.round(progress)}%</Badge>
          </div>
        </div>

        {/* Test Enhanced Stat Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📊 Enhanced Stat Cards Test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Test all colors */}
            {['blue', 'green', 'orange', 'purple', 'red', 'gray', 'yellow', 'indigo', 'pink'].map((color, index) => (
              <PulseWrapper key={color} isLoading={showSkeletons} fallback={<StatCardSkeleton />}>
                <EnhancedStatCard
                  title={`Test ${color}`}
                  value={100 + index * 10}
                  change={index % 2 === 0 ? 5 : -3}
                  changeLabel="test change"
                  icon={<Users className="h-6 w-6" />}
                  description={`Testing ${color} color`}
                  color={color as any}
                  variant="gradient"
                  showTrend={true}
                  showProgress={index % 3 === 0}
                  progressValue={70 + index * 5}
                  progressMax={100}
                  status={index % 4 === 0 ? 'success' : index % 4 === 1 ? 'warning' : 'normal'}
                />
              </PulseWrapper>
            ))}
          </div>
        </section>

        {/* Test Different Variants */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">🎨 Variants Test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['gradient', 'minimal', 'outlined'].map((variant) => (
              <EnhancedStatCard
                key={variant}
                title={`${variant} variant`}
                value={250}
                change={8.5}
                changeLabel="test variant"
                icon={<Heart className="h-6 w-6" />}
                description={`Testing ${variant} variant`}
                color="blue"
                variant={variant as any}
                showTrend={true}
              />
            ))}
          </div>
        </section>

        {/* Test Different Sizes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📏 Sizes Test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['sm', 'md', 'lg'].map((size) => (
              <EnhancedStatCard
                key={size}
                title={`Size ${size}`}
                value={150}
                change={12}
                changeLabel="test size"
                icon={<Activity className="h-6 w-6" />}
                description={`Testing ${size} size`}
                color="green"
                size={size as any}
                variant="gradient"
                showTrend={true}
              />
            ))}
          </div>
        </section>

        {/* Test Other Components */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">🧩 Other Components Test</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Stats */}
            <PulseWrapper isLoading={showSkeletons} fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
              <RealTimeStatsEnhanced
                systemHealth="healthy"
                metrics={{
                  activeUsers: 45,
                  serverLoad: 68,
                  databaseConnections: 12,
                  responseTime: 245
                }}
                showDetailedMetrics={true}
                autoRefresh={false}
              />
            </PulseWrapper>

            {/* Chart Card */}
            <PulseWrapper isLoading={showSkeletons} fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Test Chart"
                subtitle="Test data"
                chartType="bar"
                showExport={false}
              >
                <ProgressChart data={progressData} />
              </ChartCard>
            </PulseWrapper>
          </div>
        </section>

        {/* Test Timeline and Notifications */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📋 Timeline & Notifications Test</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <PulseWrapper isLoading={showSkeletons} fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
              <ActivityTimeline
                activities={mockActivities}
                onActivityClick={(activity) => console.log('Activity clicked:', activity)}
                showFilters={false}
                showSearch={false}
                maxItems={5}
              />
            </PulseWrapper>

            {/* Notification Center */}
            <PulseWrapper isLoading={showSkeletons} fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
              <NotificationCenter
                notifications={mockNotifications}
                onNotificationClick={(notification) => console.log('Notification clicked:', notification)}
                onMarkAsRead={(id) => console.log('Mark as read:', id)}
                showFilters={false}
                showSearch={false}
                maxItems={5}
              />
            </PulseWrapper>
          </div>
        </section>

        {/* Test Calendar */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📅 Calendar Test</h2>
          
          <PulseWrapper isLoading={showSkeletons} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <InteractiveCalendar
              events={mockEvents}
              onDateSelect={(date) => console.log('Date selected:', date)}
              onEventClick={(event) => console.log('Event clicked:', event)}
              onAddEvent={(date) => console.log('Add event for:', date)}
              showMiniCalendar={true}
              showEventList={true}
            />
          </PulseWrapper>
        </section>

        {/* Test Metric Comparisons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">📈 Metric Comparisons Test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <MetricComparison
                  title="Revenue"
                  current={2400000}
                  previous={2100000}
                  format="currency"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <MetricComparison
                  title="Satisfaction"
                  current={94.5}
                  previous={91.2}
                  format="percentage"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <MetricComparison
                  title="Response Time"
                  current={15}
                  previous={18}
                  unit=" minutes"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            ✅ All Enhanced Components Test Complete
          </p>
        </div>
      </div>
    </div>
  )
}
