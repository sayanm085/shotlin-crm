'use client'

import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
    id: number
    name: string
    icon: any
    description: string
}

interface WorkflowSidebarProps {
    steps: Step[]
    activeStep: number
    onStepChange: (stepId: number) => void
    getStepStatus: (stepId: number) => 'completed' | 'current' | 'locked' | 'available' | 'submitted'
}

export function WorkflowSidebar({ steps, activeStep, onStepChange, getStepStatus }: WorkflowSidebarProps) {
    return (
        <div className="w-full md:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-6 text-lg tracking-tight">Workflow</h3>
                <div className="space-y-4 relative">
                    {/* Connecting Line (Visual only, simplified for now) */}
                    <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100 -z-10" />

                    {steps.map((step) => {
                        const status = getStepStatus(step.id)
                        const isActive = activeStep === step.id
                        const StepIcon = step.icon

                        return (
                            <button
                                key={step.id}
                                onClick={() => status !== 'locked' && onStepChange(step.id)}
                                disabled={status === 'locked'}
                                className={cn(
                                    "w-full text-left relative group outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-200",
                                    status === 'locked' ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                                )}
                            >
                                <div className={cn(
                                    "relative z-10 p-3 rounded-xl border flex items-center gap-4 transition-all duration-300",
                                    isActive
                                        ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                        : status === 'completed' || status === 'submitted'
                                            ? "bg-white border-green-100 hover:border-green-200"
                                            : status === 'available'
                                                ? "bg-white border-purple-100 hover:border-purple-200 hover:shadow-sm"
                                                : "bg-gray-50/50 border-transparent"
                                )}>
                                    {/* Icon Box */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm",
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : status === 'completed' || status === 'submitted'
                                                ? "bg-green-500 text-white"
                                                : status === 'available'
                                                    ? "bg-white border-2 border-purple-500 text-purple-600"
                                                    : "bg-gray-200 text-gray-400"
                                    )}>
                                        {status === 'completed' || status === 'submitted' ? (
                                            <Check className="w-5 h-5" />
                                        ) : status === 'locked' ? (
                                            <Lock className="w-4 h-4" />
                                        ) : (
                                            <StepIcon className="w-5 h-5" />
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "font-semibold text-sm truncate transition-colors",
                                            isActive ? "text-blue-900" : "text-gray-700"
                                        )}>
                                            {step.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Active Pulse Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute md:-right-1 w-1.5 h-8 bg-blue-500 rounded-full hidden md:block"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
