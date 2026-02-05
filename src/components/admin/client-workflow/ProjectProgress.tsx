'use client'

import { motion } from 'framer-motion'
import {
    CheckCircle2,
    Circle,
    Clock,
    Globe,
    Smartphone,
    PlayCircle,
    ExternalLink,
    AlertCircle,
    Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Client {
    // Subset of client fields needed for display
    playConsoleStatus: any
    organizationCost: any
    websiteDevDone: boolean
    appDevDone: boolean
    apkUrl: string | null
    publishingStatus: string
    liveUrl: string | null
    websiteUrl: string | null
}

interface ProjectProgressProps {
    client: Client
}

export function ProjectProgress({ client }: ProjectProgressProps) {

    // Define the milestones for the timeline
    const milestones = [
        {
            id: 'play_console',
            label: 'Play Console',
            done: client.playConsoleStatus?.accountCreated,
            icon: PlayCircle
        },
        {
            id: 'domain',
            label: 'Domain',
            done: (client.organizationCost?.domainCost || 0) > 0 || !!client.websiteUrl,
            icon: Globe
        },
        {
            id: 'website',
            label: 'Website',
            done: client.websiteDevDone,
            icon: Globe
        },
        {
            id: 'app_dev',
            label: 'App Dev',
            done: client.appDevDone && client.apkUrl,
            icon: Smartphone
        },
        {
            id: 'published',
            label: 'Published',
            done: client.publishingStatus === 'PRODUCTION' || !!client.liveUrl,
            icon: CheckCircle2
        }
    ]

    return (
        <div className="space-y-8">
            {/* Header / Timeline Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Progress</h2>
                <p className="text-gray-500 mb-8">Track the live status of your application delivery.</p>

                {/* Progress Bar / Timeline */}
                <div className="relative mb-8">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 rounded-full" />

                    {/* Active Line (Calculated width based on completed steps) */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(milestones.filter(m => m.done).length / (milestones.length - 1)) * 100}%` }}
                    />

                    <div className="relative flex justify-between">
                        {milestones.map((step, index) => {
                            const Icon = step.icon
                            return (
                                <div key={step.id} className="flex flex-col items-center group">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                                        step.done
                                            ? "bg-white border-blue-500 text-blue-600 shadow-md scale-110"
                                            : "bg-gray-50 border-gray-200 text-gray-300"
                                    )}>
                                        {step.done ? <Check className="w-6 h-6 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "mt-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                                        step.done ? "text-blue-900" : "text-gray-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Detailed Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. App Development Status */}
                <div className={cn("rounded-2xl border p-6 transition-all", client.appDevDone ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-transparent")}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Mobile App</h3>
                                <p className="text-sm text-gray-500">Android Application</p>
                            </div>
                        </div>
                        {client.appDevDone ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">READY</span>
                        ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" /> IN PROGRESS
                            </span>
                        )}
                    </div>

                    <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3 text-sm">
                            <div className={cn("w-2 h-2 rounded-full", client.appDevDone ? "bg-green-500" : "bg-gray-300")} />
                            <span className={client.appDevDone ? "text-gray-700" : "text-gray-400"}>Development Complete</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className={cn("w-2 h-2 rounded-full", client.apkUrl ? "bg-green-500" : "bg-gray-300")} />
                            <span className={client.apkUrl ? "text-gray-700" : "text-gray-400"}>APK Uploaded</span>
                        </div>
                    </div>
                </div>

                {/* 2. Play Console Status */}
                <div className={cn("rounded-2xl border p-6 transition-all", client.playConsoleStatus?.accountCreated ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-transparent")}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Play Console</h3>
                                <p className="text-sm text-gray-500">Google Developer Account</p>
                            </div>
                        </div>
                        {client.playConsoleStatus?.consoleReady ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">VERIFIED</span>
                        ) : (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">SETUP</span>
                        )}
                    </div>
                    <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3 text-sm">
                            <div className={cn("w-2 h-2 rounded-full", client.playConsoleStatus?.accountCreated ? "bg-green-500" : "bg-gray-300")} />
                            <span className="text-gray-600">Account Created</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className={cn("w-2 h-2 rounded-full", client.playConsoleStatus?.identityVerificationStatus ? "bg-green-500" : "bg-gray-300")} />
                            <span className="text-gray-600">Identity Verification</span>
                        </div>
                    </div>
                </div>

                {/* 3. Website Status */}
                <div className={cn("rounded-2xl border p-6 transition-all", client.websiteDevDone ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-transparent")}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Website</h3>
                                <p className="text-sm text-gray-500">Landing Page / Domain</p>
                            </div>
                        </div>
                        {client.websiteDevDone ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">LIVE</span>
                        ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">PENDING</span>
                        )}
                    </div>
                    <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3 text-sm">
                            <div className={cn("w-2 h-2 rounded-full", client.websiteDevDone ? "bg-green-500" : "bg-gray-300")} />
                            <span className="text-gray-600">Development Done</span>
                        </div>
                        {client.websiteUrl && (
                            <a href={client.websiteUrl} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                Visit Website <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>

                {/* 4. Action Required */}
                {client.playConsoleStatus?.developerInvited === false && (
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-900">Action Required</h3>
                                <p className="text-sm text-red-800 mt-1">
                                    We need you to accept the developer invitation sent to your email to proceed with publishing.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
