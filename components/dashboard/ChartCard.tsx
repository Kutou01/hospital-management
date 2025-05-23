import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ChartCardProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ChartCard({ title, children, actions, className = "" }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">{title}</h3>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

// Component cho bar chart group (từ dashboard cũ)
interface BarChartGroupProps {
  label: string
  value1: number
  value2: number
}

export function BarChartGroup({ label, value1, value2 }: BarChartGroupProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-end space-x-1">
        <div
          className="w-4 bg-blue-500 rounded-t"
          style={{ height: `${value1}px` }}
        ></div>
        <div
          className="w-4 bg-green-500 rounded-t"
          style={{ height: `${value2}px` }}
        ></div>
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  )
}
