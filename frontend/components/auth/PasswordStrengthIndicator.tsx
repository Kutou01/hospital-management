"use client"

import React from 'react'
import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'Ít nhất 8 ký tự',
    test: (password) => password.length >= 8
  },
  {
    label: 'Có chữ hoa',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Có chữ thường',
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: 'Có số',
    test: (password) => /\d/.test(password)
  },
  {
    label: 'Có ký tự đặc biệt',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
]

export function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = () => {
    const passedRequirements = passwordRequirements.filter(req => req.test(password))
    return passedRequirements.length
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 2) return 'Yếu'
    if (strength < 4) return 'Trung bình'
    return 'Mạnh'
  }

  const strength = getPasswordStrength()
  const strengthPercentage = (strength / passwordRequirements.length) * 100

  if (!password) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Độ mạnh mật khẩu:</span>
          <span className={`text-sm font-medium ${
            strength < 2 ? 'text-red-600' : 
            strength < 4 ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {getStrengthText(strength)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        <p className="text-sm text-gray-600 font-medium">Yêu cầu mật khẩu:</p>
        {passwordRequirements.map((requirement, index) => {
          const isPassed = requirement.test(password)
          return (
            <div key={index} className="flex items-center gap-2">
              {isPassed ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${
                isPassed ? 'text-green-600' : 'text-red-600'
              }`}>
                {requirement.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  passwordRequirements.forEach(requirement => {
    if (!requirement.test(password)) {
      errors.push(requirement.label)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}
