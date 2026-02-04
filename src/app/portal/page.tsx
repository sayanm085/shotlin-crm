import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgressRing, ProgressBar } from '@/components/shared/progress-indicators'
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    FileUp,
    ArrowRight,
    XCircle,
} from 'lucide-react'
import Link from 'next/link'

// Mock client data
const projectInfo = {
    name: 'TechStart Innovations Pvt Ltd',
    projectType: 'Mobile App + Website',
    startDate: '2024-01-15',
    overallProgress: 65,
}

const blockedItems = [
    {
        task: 'Company Verification',
        reason: 'Please complete company verification on Google Play Console',
        daysBlocked: 5,
        action: 'Complete verification on Play Console',
        actionUrl: 'https://play.google.com/console',
    },
    {
        task: 'Long Description',
        reason: 'Please provide the long description for Play Store listing',
        daysBlocked: 3,
        action: 'Upload in Documents section',
        actionUrl: '/portal/documents',
    },
]

const recentUpdates = [
    { date: '2024-02-02', message: 'UI/UX Design completed', type: 'success' },
    { date: '2024-02-01', message: 'Core development started', type: 'info' },
    { date: '2024-01-28', message: 'Waiting for company verification', type: 'warning' },
    { date: '2024-01-25', message: 'MSME certificate approved', type: 'success' },
]

const pendingActions = [
    { name: 'Complete Play Console Verification', priority: 'high' },
    { name: 'Upload Long Description', priority: 'medium' },
    { name: 'Provide Feature Graphic', priority: 'medium' },
    { name: 'Upload Screenshots (6 minimum)', priority: 'medium' },
]

export default function PortalPage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Welcome back!</h1>
                    <p className="text-sm text-gray-500">{projectInfo.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="info">{projectInfo.projectType}</Badge>
                </div>
            </header>

            <main className="p-6">
                {/* Alert Banner */}
                {blockedItems.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-800">Action Required</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Your project has {blockedItems.length} blocked item(s) waiting for your action.
                                    These must be resolved before we can proceed.
                                </p>
                                <Link href="/portal/status">
                                    <Button size="sm" variant="destructive" className="mt-3 gap-1">
                                        View Details <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Project Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-8">
                                <ProgressRing percentage={projectInfo.overallProgress} size={140} strokeWidth={12} />
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Compliance</span>
                                            <span className="font-medium">75%</span>
                                        </div>
                                        <ProgressBar completed={3} total={4} showLabel={false} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Development</span>
                                            <span className="font-medium">50%</span>
                                        </div>
                                        <ProgressBar completed={3} total={6} showLabel={false} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Assets</span>
                                            <span className="font-medium">40%</span>
                                        </div>
                                        <ProgressBar completed={2} total={5} blocked={2} showLabel={false} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Days Active</span>
                                <span className="font-bold text-gray-900">19</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Tasks Completed</span>
                                <span className="font-bold text-green-600">8</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending Actions</span>
                                <span className="font-bold text-yellow-600">{pendingActions.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Blocked Items</span>
                                <span className="font-bold text-red-600">{blockedItems.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Actions */}
                    <Card className="border-yellow-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="h-5 w-5" />
                                Your Pending Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pendingActions.map((action, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <XCircle className="h-5 w-5 text-yellow-600" />
                                            <span className="text-sm font-medium text-gray-900">{action.name}</span>
                                        </div>
                                        <Badge
                                            variant={action.priority === 'high' ? 'destructive' : 'warning'}
                                            className="text-xs"
                                        >
                                            {action.priority}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                            <Link href="/portal/documents">
                                <Button className="w-full mt-4 gap-2">
                                    <FileUp className="h-4 w-4" />
                                    Upload Documents
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Recent Updates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Updates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentUpdates.map((update, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${update.type === 'success' ? 'bg-green-100' :
                                                update.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                                            }`}>
                                            {update.type === 'success' ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : update.type === 'warning' ? (
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{update.message}</p>
                                            <p className="text-xs text-gray-500">{update.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Important Notice */}
                <Card className="mt-6 bg-gray-900 text-white border-0">
                    <CardContent className="py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Important Notice</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Items marked as &quot;Blocked&quot; require your action. Project timeline automatically extends
                                    for any delays caused by pending client actions. No work can proceed until dependencies are cleared.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
