"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  RefreshCw,
  Eye,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedStatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  isLoading?: boolean
  showTrend?: boolean
  showActions?: boolean
  onRefresh?: () => void
  onViewDetails?: () => void
  className?: string
}

export function EnhancedStatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  trend,
  color = 'blue',
  isLoading = false,
  showTrend = true,
  showActions = false,
  onRefresh,
  onViewDetails,
  className
}: EnhancedStatCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  // Animate number changes
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
      const steps = 60
      const stepValue = value / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        setAnimatedValue(Math.round(stepValue * currentStep))
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setAnimatedValue(value)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [value])

  const colorClasses = {
    blue: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      icon: 'bg-blue-200 text-blue-600',
      text: 'text-blue-900',
      accent: 'text-blue-600'
    },
    green: {
      bg: 'from-green-50 to-emerald-100',
      border: 'border-green-200',
      icon: 'bg-green-200 text-green-600',
      text: 'text-green-900',
      accent: 'text-green-600'
    },
    orange: {
      bg: 'from-orange-50 to-amber-100',
      border: 'border-orange-200',
      icon: 'bg-orange-200 text-orange-600',
      text: 'text-orange-900',
      accent: 'text-orange-600'
    },
    purple: {
      bg: 'from-purple-50 to-violet-100',
      border: 'border-purple-200',
      icon: 'bg-purple-200 text-purple-600',
      text: 'text-purple-900',
      accent: 'text-purple-600'
    },
    red: {
      bg: 'from-red-50 to-rose-100',
      border: 'border-red-200',
      icon: 'bg-red-200 text-red-600',
      text: 'text-red-900',
      accent: 'text-red-600'
    }
  }

  const getTrendIcon = () => {
    if (!showTrend || change === undefined) return null
    
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-600" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-600'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const displayValue = typeof value === 'number' ? animatedValue : value

  return (
    <Card 
      className={cn(
        `bg-gradient-to-br ${colorClasses[color].bg} ${colorClasses[color].border}`,
        'hover:shadow-lg transition-all duration-300 cursor-pointer',
        isHovered && 'scale-105',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-medium ${colorClasses[color].accent}`}>
                {title}
              </p>
              {showActions && (
                <div className="flex items-center gap-1">
                  {onRefresh && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={onViewDetails}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Value */}
            {isLoading ? (
              <div className={`animate-pulse bg-${color}-200 h-8 w-16 rounded mt-1`}></div>
            ) : (
              <p className={`text-3xl font-bold ${colorClasses[color].text} mb-1`}>
                {displayValue}
              </p>
            )}

            {/* Change and Description */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showTrend && change !== undefined && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className={`text-xs font-medium ${getTrendColor()}`}>
                      {Math.abs(change)}%
                    </span>
                  </div>
                )}
                {changeLabel && (
                  <span className="text-xs text-gray-600">
                    {changeLabel}
                  </span>
                )}
              </div>
            </div>

            {description && (
              <p className={`text-xs ${colorClasses[color].accent} mt-2 flex items-center gap-1`}>
                {description}
              </p>
            )}
          </div>

          {/* Icon */}
          <div className={`p-3 ${colorClasses[color].icon} rounded-full ml-4`}>
            {icon}
          </div>
        </div>

        {/* Hover Actions */}
        {isHovered && (showActions || onViewDetails) && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <div className="flex gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white/50 hover:bg-white/70"
                  onClick={onViewDetails}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Chi tiết
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/50 hover:bg-white/70"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized stat cards for different metrics
export function AppointmentStatCard({ 
  appointments, 
  isLoading, 
  onRefresh 
}: { 
  appointments: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Cuộc hẹn hôm nay"
      value={appointments?.today || 0}
      change={12}
      changeLabel="so với hôm qua"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${appointments?.pending || 0} đang chờ xác nhận`}
      color="green"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}

export function PatientStatCard({ 
  patients, 
  isLoading, 
  onRefresh 
}: { 
  patients: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Tổng bệnh nhân"
      value={patients?.total || 0}
      change={8}
      changeLabel="tăng trưởng tháng này"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${patients?.new_this_month || 0} bệnh nhân mới`}
      color="blue"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}

export function DoctorStatCard({ 
  doctors, 
  isLoading, 
  onRefresh 
}: { 
  doctors: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Bác sĩ hoạt động"
      value={doctors?.active || 0}
      change={2}
      changeLabel="so với tuần trước"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${doctors?.total || 0} tổng số bác sĩ`}
      color="purple"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}

export function RevenueStatCard({ 
  revenue, 
  isLoading, 
  onRefresh 
}: { 
  revenue: any, 
  isLoading: boolean, 
  onRefresh?: () => void 
}) {
  return (
    <EnhancedStatCard
      title="Doanh thu tháng"
      value={`${revenue?.monthly || 0}M`}
      change={15}
      changeLabel="so với tháng trước"
      icon={<TrendingUp className="h-6 w-6" />}
      description={`${revenue?.daily || 0}K hôm nay`}
      color="orange"
      isLoading={isLoading}
      showActions={true}
      onRefresh={onRefresh}
    />
  )
}
