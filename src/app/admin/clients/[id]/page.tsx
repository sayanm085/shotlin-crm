'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import {
    ArrowLeft,
    Check,
    FileText,
    Globe,
    Smartphone,
    Upload,
    PlayCircle,
    Building2,
    Hash,
    Loader2,
    Save,
    ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { WorkflowSidebar } from '@/components/admin/client-workflow/WorkflowSidebar'
import { ProjectProgress } from '@/components/admin/client-workflow/ProjectProgress'

// Type Definitions
interface Client {
    id: string
    legalName: string
    panNumber: string
    companyType: string
    email: string
    phone: string | null
    websiteUrl: string | null
    websiteVerified: boolean

    // Parallel work fields
    websiteDesignDone: boolean
    websiteDevDone: boolean
    websiteSearchConsoleDone: boolean
    appUiDone: boolean
    appDevDone: boolean
    appTestingDone: boolean
    uploadAssetsDone: boolean
    assetsUrl: string | null
    uploadScreenshotsDone: boolean
    uploadApkDone: boolean
    apkUrl: string | null
    privacyPolicyDone: boolean
    privacyPolicyPageUrl: string | null

    appApproved: boolean
    published: boolean
    liveUrl: string | null

    publishingStatus: 'NOT_SUBMITTED' | 'IN_REVIEW' | 'PRODUCTION'
    organizationCost: {
        domainCost: number
        playConsoleFee: number
        otherCosts: number
        costNotes: string | null
    } | null

    complianceDocuments: {
        msmeStatus: string
        msmeDocumentUrl: string | null
        msmeRegistrationNumber: string | null
        dunsStatus: string
        dunsDocumentUrl: string | null
        dunsNumber: string | null
    } | null
    playConsoleStatus: {
        consoleEmail: string | null
        accountCreated: boolean
        accountPaid: boolean
        identityVerificationStatus: boolean
        companyVerificationStatus: boolean
        developerInviteEmail: string | null
        developerInvited: boolean
        paymentProfileStatus: boolean
        consoleReady: boolean
        accountSaleComplete: boolean
        accountSaleAmount: number | null
    } | null
    onboardingStatus: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'
}

const adminSteps = [
    { id: 1, name: 'Client Info', icon: Building2, description: 'Name, PAN, Company Type' },
    { id: 2, name: 'MSME', icon: FileText, description: 'Certificate Upload' },
    { id: 3, name: 'D-U-N-S', icon: Hash, description: 'Number Verification' },
    { id: 4, name: 'Review & Submit', icon: Check, description: 'Final Review' },
    { id: 5, name: 'Play Console', icon: PlayCircle, description: 'Account Setup ($25)' },
    { id: 6, name: 'Domain', icon: Globe, description: 'Buy domain if needed' },
    { id: 7, name: 'Parallel Work', icon: Smartphone, description: 'Website, App Dev, Upload' },
]

const memberSteps = [
    { id: 1, name: 'Client Info', icon: Building2, description: 'Name, PAN, Company Type' },
    { id: 2, name: 'MSME', icon: FileText, description: 'Certificate Upload' },
    { id: 3, name: 'D-U-N-S', icon: Hash, description: 'Number Verification' },
    { id: 4, name: 'Review & Submit', icon: Check, description: 'Final Review' },
    { id: 5, name: 'Project Progress', icon: PlayCircle, description: 'Live Status Dashboard' },
]

export default function ClientWorkflowPage() {
    const params = useParams()
    const clientId = params.id as string
    const { data: session } = useSession()
    const userRole = session?.user?.role

    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeStep, setActiveStep] = useState(1)

    // Form states
    const [msmeNumber, setMsmeNumber] = useState('')
    const [msmeStatus, setMsmeStatus] = useState('NOT_CREATED')
    const [dunsNumber, setDunsNumber] = useState('')
    const [dunsStatus, setDunsStatus] = useState('NOT_CREATED')
    const [domainUrl, setDomainUrl] = useState('')
    const [hasDomain, setHasDomain] = useState(false)

    // Play Console Setup state (Step 4)
    // Play Console Setup state (Step 4)
    // Unified with playConsoleStatus below for account/identity/company
    const [consolePaid, setConsolePaid] = useState(false)
    const [developerInviteEmail, setDeveloperInviteEmail] = useState('')
    const [developerInvited, setDeveloperInvited] = useState(false)

    // Parallel work states
    const [websiteStatus, setWebsiteStatus] = useState({ design: false, dev: false, searchConsole: false })
    const [playConsoleStatus, setPlayConsoleStatus] = useState({ account: false, identity: false, company: false, payment: false })
    const [appDevStatus, setAppDevStatus] = useState({ ui: false, dev: false, testing: false })
    const [uploadStatus, setUploadStatus] = useState({ assets: false, screenshots: false, uploaded: false, published: false, privacyPolicy: false })

    // Publishing status
    const [publishingStatus, setPublishingStatus] = useState<'NOT_SUBMITTED' | 'IN_REVIEW' | 'PRODUCTION'>('NOT_SUBMITTED')

    // Account sale tracking
    const [accountSaleComplete, setAccountSaleComplete] = useState(false)
    const [accountSaleAmount, setAccountSaleAmount] = useState<number>(0)

    // Organization costs (liability)
    const [orgCosts, setOrgCosts] = useState({ domainCost: 0, playConsoleFee: 0, otherCosts: 0, costNotes: '' })

    // URLs
    const [assetsUrl, setAssetsUrl] = useState('')
    const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('')
    const [apkUrl, setApkUrl] = useState('')
    const [onboardingStatus, setOnboardingStatus] = useState<'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'>('DRAFT')

    // Dialogs
    const [confirmationState, setConfirmationState] = useState<{ open: boolean; key: string | null; label: string }>({ open: false, key: null, label: '' })
    const [inputDialogState, setInputDialogState] = useState<{ open: boolean; key: string | null; label: string; url: string }>({ open: false, key: null, label: '', url: '' })

    // Initial fetch
    useEffect(() => {
        fetchClient()
    }, [clientId])

    // Auto-save logic
    const isFirstRun = useRef(true)

    // Auto-save all Parallel Work (Step 7) inputs — only when viewing Step 7
    const autoSaveData = JSON.stringify({
        website: websiteStatus,
        appDev: appDevStatus,
        upload: uploadStatus,
        publishingStatus,
        accountSaleComplete,
        accountSaleAmount,
        assetsUrl,
        privacyPolicyUrl,
        apkUrl,
        orgCosts,
    })

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }

        // Only auto-save when the user is actually on Step 7
        if (activeStep !== 7) return
        if (!client) return

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/clients/${clientId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        step: 7,
                        data: {
                            consoleEmail: client.email,
                            website: websiteStatus,
                            playConsole: playConsoleStatus,
                            appDev: appDevStatus,
                            upload: {
                                ...uploadStatus,
                                assetsUrl: assetsUrl,
                                privacyPolicyUrl: privacyPolicyUrl,
                                apkUrl: apkUrl
                            },
                            publishingStatus: publishingStatus,
                            accountSale: {
                                complete: accountSaleComplete,
                                amount: accountSaleAmount,
                            },
                            orgCosts: orgCosts,
                        }
                    }),
                })
                if (res.ok) {
                    toast.success('Progress saved')
                } else {
                    toast.error('Failed to save progress')
                }
            } catch (error) {
                console.error('Auto-save error:', error)
                toast.error('Auto-save failed')
            }
        }, 1500)

        return () => clearTimeout(timer)
    }, [autoSaveData, activeStep])

    const fetchClient = async () => {
        try {
            const res = await fetch(`/api/clients/${clientId}`, { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setClient(data)

                if (data.complianceDocuments) {
                    setMsmeStatus(data.complianceDocuments.msmeStatus)
                    setMsmeNumber(data.complianceDocuments.msmeRegistrationNumber || '')
                    setDunsStatus(data.complianceDocuments.dunsStatus)
                    setDunsNumber(data.complianceDocuments.dunsNumber || '')
                }

                if (data.playConsoleStatus) {
                    // consolePaid is specific to Step 5 ($25 fee)
                    setConsolePaid(data.playConsoleStatus.accountPaid || false)

                    // Specific to Step 5
                    setDeveloperInviteEmail(data.playConsoleStatus.developerInviteEmail || '')
                    setDeveloperInvited(data.playConsoleStatus.developerInvited || false)

                    // Unified status object for both Step 5 and 7
                    setPlayConsoleStatus({
                        account: data.playConsoleStatus.accountCreated || false,
                        identity: data.playConsoleStatus.identityVerificationStatus || false,
                        company: data.playConsoleStatus.companyVerificationStatus || false,
                        payment: data.playConsoleStatus.paymentProfileStatus || false,
                    })
                }

                if (data.websiteUrl) {
                    setDomainUrl(data.websiteUrl)
                    setHasDomain(true)
                }

                setWebsiteStatus({
                    design: data.websiteDesignDone || false,
                    dev: data.websiteDevDone || false,
                    searchConsole: data.websiteSearchConsoleDone || data.websiteVerified || false
                })
                setAppDevStatus({
                    ui: data.appUiDone || false,
                    dev: data.appDevDone || false,
                    testing: data.appTestingDone || false
                })
                setUploadStatus({
                    assets: data.uploadAssetsDone || false,
                    screenshots: data.uploadScreenshotsDone || false,
                    uploaded: data.uploadApkDone || false,
                    published: data.published || false,
                    privacyPolicy: data.privacyPolicyDone || false
                })
                setAssetsUrl(data.assetsUrl || '')
                setPrivacyPolicyUrl(data.privacyPolicyUrl || '')
                setApkUrl(data.apkUrl || '')

                setPublishingStatus(data.publishingStatus || 'NOT_SUBMITTED')

                if (data.playConsoleStatus) {
                    setAccountSaleComplete(data.playConsoleStatus.accountSaleComplete || false)
                    setAccountSaleAmount(data.playConsoleStatus.accountSaleAmount || 0)
                }

                if (data.organizationCost) {
                    setOrgCosts({
                        domainCost: data.organizationCost.domainCost || 0,
                        playConsoleFee: data.organizationCost.playConsoleFee || 0,
                        otherCosts: data.organizationCost.otherCosts || 0,
                        costNotes: data.organizationCost.costNotes || ''
                    })
                }

                if (data.onboardingStatus) {
                    setOnboardingStatus(data.onboardingStatus)
                }

                calculateActiveStep(data)
            }
        } catch (error) {
            console.error('Error fetching client:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateActiveStep = (data: Client) => {
        // Step 1: Basic Info (Always assumed start)
        let step = 1;

        // Step 1: Basic Info
        // Standard start for new clients (MSME not yet started)
        if (!data.complianceDocuments?.msmeStatus || data.complianceDocuments.msmeStatus === 'NOT_CREATED') {
            setActiveStep(1)
            return
        }

        // Step 2: MSME
        if (data.complianceDocuments?.msmeStatus !== 'APPROVED') {
            setActiveStep(2)
            return
        }
        step = 3

        // Step 3: DUNS
        if (data.complianceDocuments?.dunsStatus !== 'APPROVED') {
            setActiveStep(3)
            return
        }
        step = 4

        // Step 4: Review & Submit (New Step)
        // If status is DRAFT, stay on Step 4.
        if (!data.onboardingStatus || data.onboardingStatus === 'DRAFT') {
            setActiveStep(4)
            return
        }
        step = 5

        // Step 5: Play Console Setup (Admin ID: 5)
        // For Members, if submitted, they see Dashboard.
        // Required: Account Created, Paid ($25), Identity Verified, Company Verified
        const consoleReady = data.playConsoleStatus?.accountCreated &&
            data.playConsoleStatus?.accountPaid &&
            data.playConsoleStatus?.identityVerificationStatus &&
            data.playConsoleStatus?.companyVerificationStatus

        if (!consoleReady) {
            setActiveStep(5)
            return
        }
        step = 6

        // Step 6: Domain
        // Required: Domain purchased/owned and entered
        const domainReady = data.websiteVerified || (data.websiteUrl && data.websiteUrl.length > 0)

        if (!domainReady) {
            setActiveStep(6)
            return
        }
        step = 7

        // Step 7: Parallel Work (Final Phase)
        setActiveStep(7)
    }

    const submitApplication = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboardingStatus: 'SUBMITTED' }),
            })
            if (res.ok) {
                toast.success('Application submitted successfully!')
                // Force a re-fetch to ensure all server-side logic (and potentially other side effects) are captured
                await fetchClient()
                // Explicitly set the step to 5 locally as a fallback to immediate navigation
                setActiveStep(5)
                // Also update local state to avoid flicker before fetch completes
                setOnboardingStatus('SUBMITTED')
            } else {
                toast.error('Failed to submit application')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    const saveStep = async (stepNum: number, data: Record<string, unknown>) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: stepNum, data }),
            })
            if (res.ok) {
                toast.success('Step saved successfully')
                // For step 7 (Parallel Work), do NOT re-fetch the whole client.
                // Re-fetching triggers calculateActiveStep which can reset the
                // active step based on stale DB data before the update propagates.
                if (stepNum !== 7) {
                    await fetchClient()
                    // Auto-advance to next step
                    if (stepNum === activeStep && stepNum < 7) setActiveStep(stepNum + 1)
                }
            } else {
                toast.error('Failed to save step')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    const handleUploadCheckboxToggle = (key: string, label: string, currentUrl?: string, requiresUrl: boolean = false) => {
        const isCurrentlyChecked = uploadStatus[key as keyof typeof uploadStatus]
        if (isCurrentlyChecked && currentUrl && currentUrl.length > 0) {
            setConfirmationState({ open: true, key, label })
            return
        }
        if (!isCurrentlyChecked && requiresUrl) {
            setInputDialogState({
                open: true,
                key,
                label,
                url: ''
            })
            return
        }
        setUploadStatus(prev => ({ ...prev, [key]: !prev[key as keyof typeof uploadStatus] }))
    }

    const confirmUncheck = () => {
        if (confirmationState.key) {
            const key = confirmationState.key
            if (key === 'assets') setAssetsUrl('')
            if (key === 'privacyPolicy') setPrivacyPolicyUrl('')
            if (key === 'uploaded') setApkUrl('')
            setUploadStatus(prev => ({ ...prev, [key]: false }))
        }
        setConfirmationState({ open: false, key: null, label: '' })
    }

    const confirmInput = () => {
        if (inputDialogState.key) {
            const key = inputDialogState.key
            const url = inputDialogState.url
            if (key === 'assets') setAssetsUrl(url)
            if (key === 'privacyPolicy') setPrivacyPolicyUrl(url)
            if (key === 'uploaded') setApkUrl(url)

            setUploadStatus(prev => {
                const newState = { ...prev, [key]: true }
                // Send ALL parallel-work data so the backend doesn't reset other sections
                const saveData = {
                    consoleEmail: client?.email,
                    website: websiteStatus,
                    playConsole: playConsoleStatus,
                    appDev: appDevStatus,
                    upload: {
                        ...newState,
                        assetsUrl: key === 'assets' ? url : assetsUrl,
                        privacyPolicyUrl: key === 'privacyPolicy' ? url : privacyPolicyUrl,
                        apkUrl: key === 'uploaded' ? url : apkUrl,
                    },
                    publishingStatus: publishingStatus,
                    accountSale: {
                        complete: accountSaleComplete,
                        amount: accountSaleAmount,
                    },
                    orgCosts: orgCosts,
                }
                saveStep(7, saveData)
                return newState
            })
        }
        setInputDialogState({ open: false, key: null, label: '', url: '' })
    }

    const getStepStatus = (stepId: number) => {
        if (stepId <= 3) {
            if (stepId < activeStep) return 'completed'
            if (stepId === activeStep) return 'current'
            return 'locked'
        }
        if (activeStep >= 4) {
            if (stepId === activeStep) return 'current'
            return 'available'
        }
        return 'locked'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!client) return <div className="p-8 text-center text-gray-500">Client not found</div>

    if (!client) return <div className="p-8 text-center text-gray-500">Client not found</div>

    // Show Member Dashboard only if submitted and verified (Step 5+)
    const showMemberDashboard = userRole === 'MEMBER' && activeStep >= 5

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            <AdminHeader title={client.legalName} subtitle="Client Workflow" />

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <Link href="/admin/clients">
                    <Button variant="ghost" className="mb-6 gap-2 text-gray-600 hover:text-gray-900 group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Clients
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row gap-8">
                    <WorkflowSidebar
                        steps={userRole === 'MEMBER'
                            ? memberSteps.filter(s => s.id !== 5 || client.onboardingStatus !== 'DRAFT')
                            : adminSteps}
                        activeStep={activeStep}
                        onStepChange={setActiveStep}
                        getStepStatus={getStepStatus}
                    />

                    <div className="flex-1 min-w-0">
                        {/* Member Project Progress Dashboard (Step 5) */}
                        {showMemberDashboard && (
                            <ProjectProgress client={client} />
                        )}

                        {/* Regular Steps for Setup */}
                        {!showMemberDashboard && (
                            <>
                                {/* Step 1: Client Info */}
                                {activeStep === 1 && (
                                    <Card className="shadow-lg border-gray-100 rounded-2xl overflow-hidden">
                                        <div className="bg-white p-8">
                                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Client Information</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                                {[
                                                    ['Legal Name', client.legalName],
                                                    ['PAN Number', client.panNumber],
                                                    ['Company Type', client.companyType.replace('_', ' ')],
                                                    ['Email', client.email],
                                                    ['Phone', client.phone || '-']
                                                ].map(([label, value]) => (
                                                    <div key={label}>
                                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">{label}</label>
                                                        <p className="font-medium text-gray-900 text-lg">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 flex justify-end">
                                                <Button onClick={() => setActiveStep(2)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl px-6">
                                                    Next: MSME <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Step 2: MSME */}
                                {activeStep === 2 && (
                                    <Card className="shadow-lg border-gray-100 rounded-2xl">
                                        <CardContent className="p-8">
                                            <h2 className="text-2xl font-bold mb-6 text-gray-900">MSME Certificate</h2>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700">MSME/Udyam Number</label>
                                                    <Input
                                                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                        placeholder="UDYAM-XX-00-0000000"
                                                        value={msmeNumber}
                                                        onChange={(e) => setMsmeNumber(e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700">Verification Status</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['NOT_CREATED', 'PENDING', 'APPROVED'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => setMsmeStatus(status)}
                                                                className={`px-5 py-2.5 rounded-xl border font-medium transition-all ${msmeStatus === status
                                                                    ? status === 'APPROVED' ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                                                                        : status === 'PENDING' ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/20'
                                                                            : 'bg-gray-600 text-white border-gray-600 shadow-lg'
                                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {status.replace('_', ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-blue-900 font-medium">Need an MSME Certificate?</p>
                                                        <p className="text-sm text-blue-700 mt-0.5">
                                                            Register for free at the <a href="https://udyamregistration.gov.in" target="_blank" className="underline hover:text-blue-900">Official Portal</a>.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex justify-between">
                                                <Button variant="ghost" onClick={() => setActiveStep(1)} className="hover:bg-gray-100 rounded-xl">← Previous</Button>
                                                <Button
                                                    onClick={() => saveStep(2, { status: msmeStatus, number: msmeNumber })}
                                                    disabled={saving}
                                                    className="gap-2 bg-gray-900 hover:bg-black text-white rounded-xl px-6 disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    Save & Next
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 3: DUNS */}
                                {activeStep === 3 && (
                                    <Card className="shadow-lg border-gray-100 rounded-2xl">
                                        <CardContent className="p-8">
                                            <h2 className="text-2xl font-bold mb-6 text-gray-900">D-U-N-S Number</h2>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700">D-U-N-S Number</label>
                                                    <Input
                                                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                        placeholder="00-000-0000"
                                                        value={dunsNumber}
                                                        onChange={(e) => setDunsNumber(e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700">Verification Status</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['NOT_CREATED', 'PENDING', 'APPROVED'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => setDunsStatus(status)}
                                                                className={`px-5 py-2.5 rounded-xl border font-medium transition-all ${dunsStatus === status
                                                                    ? status === 'APPROVED' ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                                                                        : status === 'PENDING' ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/20'
                                                                            : 'bg-gray-600 text-white border-gray-600 shadow-lg'
                                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {status.replace('_', ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                        <Hash className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-purple-900 font-medium">Why D-U-N-S?</p>
                                                        <p className="text-sm text-purple-700 mt-0.5">
                                                            Required by Google & Apple for organizational verification. <a href="https://www.dnb.com/duns.html" target="_blank" className="underline hover:text-purple-900">Learn more</a>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex justify-between">
                                                <Button variant="ghost" onClick={() => setActiveStep(2)} className="hover:bg-gray-100 rounded-xl">← Previous</Button>
                                                <Button
                                                    onClick={() => saveStep(3, { status: dunsStatus, number: dunsNumber })}
                                                    disabled={saving}
                                                    className="gap-2 bg-gray-900 hover:bg-black text-white rounded-xl px-6 disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    Save & Next
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 4: Review & Submit */}
                                {activeStep === 4 && (
                                    <Card className="shadow-lg border-gray-100 rounded-2xl">
                                        <div className="bg-white p-8">
                                            <div className="text-center mb-8">
                                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
                                                <p className="text-gray-500 mt-2">Please review your details before final submission.</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-6 space-y-4 mb-8">
                                                <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="block text-gray-500">Legal Name</span>
                                                        <span className="font-medium">{client.legalName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">PAN Number</span>
                                                        <span className="font-medium">{client.panNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">Company Type</span>
                                                        <span className="font-medium">{client.companyType}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">Email</span>
                                                        <span className="font-medium">{client.email}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">MSME Status</span>
                                                        <span className="font-medium text-green-600">{msmeStatus}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">DUNS Status</span>
                                                        <span className="font-medium text-green-600">{dunsStatus}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <Button variant="ghost" onClick={() => setActiveStep(3)}>Back</Button>
                                                <Button
                                                    onClick={submitApplication}
                                                    disabled={saving}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg shadow-green-500/20 rounded-xl"
                                                >
                                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                                                    Submit Information
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Step 5: Play Console (Admin View) */}
                                {activeStep === 5 && (
                                    <Card className="shadow-lg border-gray-100 rounded-2xl">
                                        <CardContent className="p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">Google Play Console</h2>
                                                    <p className="text-gray-500 mt-1">One-time setup fee of $25 paid by the organization.</p>
                                                </div>
                                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                                    Required
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {[
                                                    {
                                                        label: 'Create Play Console Account',
                                                        state: playConsoleStatus.account,
                                                        setter: (val: boolean) => setPlayConsoleStatus(prev => ({ ...prev, account: val }))
                                                    },
                                                    {
                                                        label: 'Pay Registration Fee ($25)',
                                                        state: consolePaid,
                                                        setter: (val: boolean) => setConsolePaid(val)
                                                    },
                                                    {
                                                        label: 'Verify Identity',
                                                        state: playConsoleStatus.identity,
                                                        setter: (val: boolean) => setPlayConsoleStatus(prev => ({ ...prev, identity: val }))
                                                    },
                                                    {
                                                        label: 'Verify Company',
                                                        state: playConsoleStatus.company,
                                                        setter: (val: boolean) => setPlayConsoleStatus(prev => ({ ...prev, company: val }))
                                                    },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors bg-white">
                                                        <span className="font-medium text-gray-700">{item.label}</span>
                                                        <button
                                                            onClick={() => item.setter(!item.state)}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.state
                                                                ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                                                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {item.state && <Check className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="mt-8 pt-8 border-t border-gray-100">
                                                    <h3 className="font-bold text-gray-900 mb-4">Developer Access</h3>
                                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                                        <div className="mb-4">
                                                            <label className="block text-sm font-medium text-blue-900 mb-2">Invite Developer Email</label>
                                                            <div className="flex gap-3">
                                                                <Input
                                                                    value={developerInviteEmail}
                                                                    onChange={(e) => setDeveloperInviteEmail(e.target.value)}
                                                                    placeholder="developer@shotlin.com"
                                                                    className="bg-white border-blue-200 focus:border-blue-500 rounded-xl"
                                                                />
                                                                <button
                                                                    onClick={() => setDeveloperInvited(!developerInvited)}
                                                                    className={`px-4 rounded-xl font-medium transition-all ${developerInvited
                                                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                                                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                                                                        }`}
                                                                >
                                                                    {developerInvited ? 'Invited' : 'Send Invite'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex justify-between">
                                                    <Button variant="ghost" onClick={() => setActiveStep(3)} className="hover:bg-gray-100 rounded-xl">← Previous</Button>
                                                    <Button
                                                        onClick={() => saveStep(5, {
                                                            accountCreated: playConsoleStatus.account,
                                                            accountPaid: consolePaid,
                                                            identityVerified: playConsoleStatus.identity,
                                                            companyVerified: playConsoleStatus.company,
                                                            developerEmail: developerInviteEmail || null,
                                                            developerInvited: developerInvited,
                                                        })}
                                                        disabled={saving}
                                                        className="gap-2 bg-gray-900 hover:bg-black text-white rounded-xl px-6"
                                                    >
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        Save & Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 6: Domain */}
                                {activeStep === 6 && (
                                    <Card className="shadow-lg border-gray-100 rounded-2xl">
                                        <CardContent className="p-8">
                                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Domain Configuration</h2>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700">Does client have a domain?</label>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => setHasDomain(true)}
                                                            className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${hasDomain ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            ✅ Yes, has domain
                                                        </button>
                                                        <button
                                                            onClick={() => setHasDomain(false)}
                                                            className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${!hasDomain ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            🛒 Need to buy
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700">Domain URL</label>
                                                    <Input
                                                        placeholder="example.com"
                                                        value={domainUrl}
                                                        onChange={(e) => setDomainUrl(e.target.value)}
                                                        className="h-12 rounded-xl"
                                                    />
                                                </div>

                                                {!hasDomain && (
                                                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4">
                                                        <p className="text-sm text-yellow-800">
                                                            ⚠️ Buy domain from: <a href="https://www.godaddy.com" target="_blank" className="underline hover:text-yellow-900">GoDaddy</a>,
                                                            <a href="https://www.namecheap.com" target="_blank" className="underline ml-1 hover:text-yellow-900">Namecheap</a>, or
                                                            <a href="https://domains.google" target="_blank" className="underline ml-1 hover:text-yellow-900">Google Domains</a>
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mt-8 flex justify-between">
                                                    <Button variant="ghost" onClick={() => setActiveStep(4)} className="hover:bg-gray-100 rounded-xl">← Previous</Button>
                                                    <Button
                                                        onClick={() => saveStep(6, { url: domainUrl, verified: hasDomain })}
                                                        disabled={saving}
                                                        className="gap-2 bg-gray-900 hover:bg-black text-white rounded-xl px-6"
                                                    >
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        Save & Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 7: Parallel Work */}
                                {activeStep === 7 && (
                                    <div className="space-y-6">
                                        {/* Header with overall progress */}
                                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-12 opacity-10 transform rotate-12 bg-white rounded-3xl w-64 h-64 -mr-16 -mt-16 blur-2xl"></div>
                                            <div className="relative z-10 flex items-center justify-between mb-6">
                                                <div>
                                                    <h2 className="text-3xl font-bold tracking-tight">Parallel Work Phase</h2>
                                                    <p className="text-indigo-100 mt-2 text-lg">Track progress across all development tasks</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-4xl font-bold">
                                                        {Math.round((
                                                            (Object.values(websiteStatus).filter(Boolean).length / 3) +
                                                            (Object.values(playConsoleStatus).filter(Boolean).length / 4) +
                                                            (Object.values(appDevStatus).filter(Boolean).length / 3) +
                                                            (Object.values(uploadStatus).filter(Boolean).length / 4)
                                                        ) / 4 * 100)}%
                                                    </div>
                                                    <div className="text-indigo-200 font-medium">Overall Progress</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-3 relative z-10">
                                                <div
                                                    className="bg-white rounded-full h-3 transition-all duration-1000 ease-out"
                                                    style={{
                                                        width: `${Math.round((
                                                            (Object.values(websiteStatus).filter(Boolean).length / 3) +
                                                            (Object.values(playConsoleStatus).filter(Boolean).length / 4) +
                                                            (Object.values(appDevStatus).filter(Boolean).length / 3) +
                                                            (Object.values(uploadStatus).filter(Boolean).length / 4)
                                                        ) / 4 * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Website Card */}
                                            <Card className="rounded-2xl shadow-md border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5">
                                                    <div className="flex items-center justify-between text-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Globe className="h-6 w-6" /></div>
                                                            <h3 className="font-bold text-lg">Website</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-3">
                                                    {[
                                                        { key: 'design', label: 'Design Complete', icon: '🎨' },
                                                        { key: 'dev', label: 'Development Done', icon: '💻' },
                                                        { key: 'searchConsole', label: 'Search Console Linked', icon: '🔗' },
                                                    ].map((item) => (
                                                        <button
                                                            key={item.key}
                                                            onClick={() => setWebsiteStatus({ ...websiteStatus, [item.key]: !websiteStatus[item.key as keyof typeof websiteStatus] })}
                                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${websiteStatus[item.key as keyof typeof websiteStatus]
                                                                ? 'border-green-500 bg-green-50/50'
                                                                : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xl">{item.icon}</span>
                                                                <span className={`font-medium ${websiteStatus[item.key as keyof typeof websiteStatus] ? 'text-green-800' : 'text-gray-700'}`}>
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                            {websiteStatus[item.key as keyof typeof websiteStatus] &&
                                                                <div className="bg-green-100 text-green-700 p-1 rounded-full"><Check className="h-4 w-4" /></div>
                                                            }
                                                        </button>
                                                    ))}
                                                </div>
                                            </Card>

                                            {/* Play Console Card */}
                                            <Card className="rounded-2xl shadow-md border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5">
                                                    <div className="flex items-center justify-between text-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><PlayCircle className="h-6 w-6" /></div>
                                                            <h3 className="font-bold text-lg">Play Console</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-3">
                                                    {[
                                                        { key: 'account', label: 'Account Created', icon: '👤' },
                                                        { key: 'identity', label: 'Identity Verified', icon: '🆔' },
                                                        { key: 'company', label: 'Company Verified', icon: '🏢' },
                                                        { key: 'payment', label: 'Payment Profile', icon: '💳' },
                                                    ].map((item) => (
                                                        <button
                                                            key={item.key}
                                                            onClick={() => setPlayConsoleStatus({ ...playConsoleStatus, [item.key]: !playConsoleStatus[item.key as keyof typeof playConsoleStatus] })}
                                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${playConsoleStatus[item.key as keyof typeof playConsoleStatus]
                                                                ? 'border-green-500 bg-green-50/50'
                                                                : 'border-gray-100 hover:border-green-200 hover:bg-green-50/30'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xl">{item.icon}</span>
                                                                <span className={`font-medium ${playConsoleStatus[item.key as keyof typeof playConsoleStatus] ? 'text-green-800' : 'text-gray-700'}`}>
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                            {playConsoleStatus[item.key as keyof typeof playConsoleStatus] &&
                                                                <div className="bg-green-100 text-green-700 p-1 rounded-full"><Check className="h-4 w-4" /></div>
                                                            }
                                                        </button>
                                                    ))}
                                                </div>
                                            </Card>

                                            {/* App Development & Upload Cards follow similar pattern... */}
                                            <Card className="rounded-2xl shadow-md border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5">
                                                    <div className="flex items-center justify-between text-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Smartphone className="h-6 w-6" /></div>
                                                            <h3 className="font-bold text-lg">App Development</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-3">
                                                    {[{ key: 'ui', label: 'UI/UX Design', icon: '🎯' }, { key: 'dev', label: 'Development', icon: '⚙️' }, { key: 'testing', label: 'Testing', icon: '✅' }].map((item) => (
                                                        <button key={item.key} onClick={() => setAppDevStatus({ ...appDevStatus, [item.key]: !appDevStatus[item.key as keyof typeof appDevStatus] })} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${appDevStatus[item.key as keyof typeof appDevStatus] ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/30'}`}>
                                                            <div className="flex items-center gap-4"><span className="text-xl">{item.icon}</span><span className={`font-medium ${appDevStatus[item.key as keyof typeof appDevStatus] ? 'text-green-800' : 'text-gray-700'}`}>{item.label}</span></div>
                                                            {appDevStatus[item.key as keyof typeof appDevStatus] && <div className="bg-green-100 text-green-700 p-1 rounded-full"><Check className="h-4 w-4" /></div>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </Card>

                                            <Card className="rounded-2xl shadow-md border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5">
                                                    <div className="flex items-center justify-between text-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Upload className="h-6 w-6" /></div>
                                                            <h3 className="font-bold text-lg">App Upload</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-3">
                                                    {[
                                                        { key: 'assets', label: 'Assets Ready', icon: '📦', urlState: assetsUrl, requiresUrl: true },
                                                        { key: 'screenshots', label: 'Screenshots Done', icon: '📸', requiresUrl: false },
                                                        { key: 'privacyPolicy', label: 'Privacy Policy', icon: '📄', urlState: privacyPolicyUrl, requiresUrl: true },
                                                        { key: 'uploaded', label: 'AAB/APK Link', icon: '☁️', urlState: apkUrl, requiresUrl: true },
                                                        { key: 'published', label: 'Published', icon: '🚀', requiresUrl: false },
                                                    ].map((item) => (
                                                        <div key={item.key} className={`rounded-xl border transition-all ${uploadStatus[item.key as keyof typeof uploadStatus] ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/30'}`}>
                                                            <button
                                                                onClick={() => {
                                                                    const currentUrl = 'urlState' in item ? item.urlState : undefined
                                                                    handleUploadCheckboxToggle(item.key, item.label, currentUrl, item.requiresUrl)
                                                                }}
                                                                className="w-full flex items-center justify-between p-4"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-xl">{item.icon}</span>
                                                                    <span className={`font-medium ${uploadStatus[item.key as keyof typeof uploadStatus] ? 'text-green-800' : 'text-gray-700'}`}>{item.label}</span>
                                                                </div>
                                                                {uploadStatus[item.key as keyof typeof uploadStatus] && <div className="bg-green-100 text-green-700 p-1 rounded-full"><Check className="h-4 w-4" /></div>}
                                                            </button>
                                                            {uploadStatus[item.key as keyof typeof uploadStatus] && 'urlState' in item && item.urlState && (
                                                                <div className="px-4 pb-4 -mt-1 pl-12 flex">
                                                                    <a
                                                                        href={item.urlState.startsWith('http') ? item.urlState : `https://${item.urlState}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-100 transition-colors"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink className="h-3 w-3" />
                                                                        {item.urlState}
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Publishing Status & Costs */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card className="rounded-2xl shadow-md border-gray-100 p-6">
                                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-blue-500 rounded-full"></div> Publishing Status</h3>
                                                <div className="flex flex-col gap-3">
                                                    {(['NOT_SUBMITTED', 'IN_REVIEW', 'PRODUCTION'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => setPublishingStatus(status)}
                                                            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all text-left flex items-center justify-between ${publishingStatus === status
                                                                ? status === 'PRODUCTION' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                                                    : status === 'IN_REVIEW' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
                                                                        : 'bg-gray-800 text-white shadow-lg'
                                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {status === 'NOT_SUBMITTED' && '📝 Not Submitted'}
                                                            {status === 'IN_REVIEW' && '⏳ In Review'}
                                                            {status === 'PRODUCTION' && '✅ Production'}
                                                            {publishingStatus === status && <Check className="h-5 w-5" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </Card>

                                            <Card className="rounded-2xl shadow-md border-gray-100 p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                                                <h3 className="font-bold mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-emerald-500 rounded-full"></div> Account Sale</h3>
                                                <div className="space-y-6">
                                                    <button
                                                        onClick={() => setAccountSaleComplete(!accountSaleComplete)}
                                                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${accountSaleComplete ? 'border-emerald-500 bg-emerald-500/20' : 'border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        <span className="font-medium">{accountSaleComplete ? 'Done: Sale Complete' : 'Pending: Not Sold'}</span>
                                                        {accountSaleComplete && <Check className="h-5 w-5 text-emerald-500" />}
                                                    </button>
                                                    <div>
                                                        <label className="text-sm text-gray-400 block mb-2">Sale Amount (₹)</label>
                                                        <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-xl border border-gray-600 focus-within:border-emerald-500 transition-colors">
                                                            <span className="text-xl font-bold text-gray-400">₹</span>
                                                            <input
                                                                type="number"
                                                                value={accountSaleAmount}
                                                                onChange={(e) => setAccountSaleAmount(Number(e.target.value))}
                                                                className="bg-transparent outline-none w-full text-xl font-bold"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Costs Section */}
                                        <Card className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg rounded-2xl overflow-hidden">
                                            <div className="p-8">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><Building2 className="h-6 w-6" /></div>
                                                    <div>
                                                        <h3 className="text-xl font-bold">Organization Liability</h3>
                                                        <p className="text-red-100">Costs covered by company</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                    {['Domain Cost', 'Play Console Fee', 'Other Costs'].map((label, i) => {
                                                        const keys = ['domainCost', 'playConsoleFee', 'otherCosts'] as const;
                                                        const key = keys[i];
                                                        return (
                                                            <div key={key} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                                                <label className="text-red-100 text-sm mb-1 block">{label}</label>
                                                                <div className="text-2xl font-bold flex items-center gap-1">
                                                                    ₹<input
                                                                        type="number"
                                                                        value={orgCosts[key]}
                                                                        onChange={(e) => setOrgCosts({ ...orgCosts, [key]: Number(e.target.value) })}
                                                                        className="bg-transparent outline-none w-full placeholder-white/50"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex justify-between items-center">
                                                    <span className="font-medium text-lg">Total Liability</span>
                                                    <span className="text-3xl font-bold">₹{(orgCosts.domainCost + orgCosts.playConsoleFee + orgCosts.otherCosts).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Save Button */}
                                        <div className="flex justify-end pt-4 pb-8">
                                            <Button
                                                onClick={() => {
                                                    saveStep(7, {
                                                        consoleEmail: client.email,
                                                        website: websiteStatus,
                                                        playConsole: playConsoleStatus,
                                                        appDev: appDevStatus,
                                                        upload: {
                                                            ...uploadStatus,
                                                            assetsUrl: assetsUrl,
                                                            privacyPolicyUrl: privacyPolicyUrl,
                                                            apkUrl: apkUrl
                                                        },
                                                        publishingStatus: publishingStatus,
                                                        accountSale: {
                                                            complete: accountSaleComplete,
                                                            amount: accountSaleAmount,
                                                        },
                                                        orgCosts: orgCosts,
                                                    })
                                                }}
                                                disabled={saving}
                                                className="bg-gray-900 hover:bg-black text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all gap-3"
                                            >
                                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                                Save All Progress
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            </>
                        )}
                    </div>
                </div>
            </main>

            <AlertDialog open={confirmationState.open} onOpenChange={(open) => !open && setConfirmationState({ ...confirmationState, open: false })}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {confirmationState.label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear the saved URL and uncheck the item. Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmUncheck} className="bg-red-600 hover:bg-red-700 rounded-xl">
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={inputDialogState.open} onOpenChange={(open) => !open && setInputDialogState({ ...inputDialogState, open: false })}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Enter Details for {inputDialogState.label}</DialogTitle>
                        <DialogDescription>
                            Please provide the URL or Link for this item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link-url" className="sr-only">Link</Label>
                            <Input
                                id="link-url"
                                placeholder="https://..."
                                value={inputDialogState.url}
                                onChange={(e) => setInputDialogState({ ...inputDialogState, url: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button variant="secondary" onClick={() => setInputDialogState({ ...inputDialogState, open: false })} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button type="submit" onClick={confirmInput} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            Save & Check
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
