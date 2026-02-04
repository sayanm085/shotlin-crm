'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    ArrowLeft,
    Check,
    Circle,
    FileText,
    Globe,
    Smartphone,
    Upload,
    PlayCircle,
    Building2,
    Hash,
    Loader2,
    Save,
} from 'lucide-react'
import Link from 'next/link'

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
    uploadScreenshotsDone: boolean
    uploadApkDone: boolean
    appApproved: boolean
    published: boolean
    liveUrl: string | null
    complianceDocuments: {
        msmeStatus: string
        msmeDocumentUrl: string | null
        dunsStatus: string
        dunsDocumentUrl: string | null
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
    } | null
}

// Steps: 1-Client Info, 2-MSME, 3-DUNS, 4-Play Console Setup, 5-Domain, 6-Parallel Work
const steps = [
    { id: 1, name: 'Client Info', icon: Building2, description: 'Name, PAN, Company Type' },
    { id: 2, name: 'MSME', icon: FileText, description: 'Certificate Upload' },
    { id: 3, name: 'D-U-N-S', icon: Hash, description: 'Number Verification' },
    { id: 4, name: 'Play Console', icon: PlayCircle, description: 'Account Setup ($25)' },
    { id: 5, name: 'Domain', icon: Globe, description: 'Buy domain if needed' },
    { id: 6, name: 'Parallel Work', icon: Smartphone, description: 'Website, App Dev, Upload' },
]

export default function ClientWorkflowPage() {
    const params = useParams()
    const clientId = params.id as string

    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeStep, setActiveStep] = useState(1)

    // Form states for each step
    const [msmeNumber, setMsmeNumber] = useState('')
    const [msmeStatus, setMsmeStatus] = useState('NOT_CREATED')
    const [dunsNumber, setDunsNumber] = useState('')
    const [dunsStatus, setDunsStatus] = useState('NOT_CREATED')
    const [domainUrl, setDomainUrl] = useState('')
    const [hasDomain, setHasDomain] = useState(false)

    // Play Console Setup state (Step 4)
    const [consoleAccountCreated, setConsoleAccountCreated] = useState(false)
    const [consolePaid, setConsolePaid] = useState(false)
    const [consoleIdentityVerified, setConsoleIdentityVerified] = useState(false)
    const [consoleCompanyVerified, setConsoleCompanyVerified] = useState(false)
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
    const [orgCosts, setOrgCosts] = useState({ domainCost: 0, playConsoleFee: 25, otherCosts: 0, costNotes: '' })

    useEffect(() => {
        fetchClient()
    }, [clientId])

    const fetchClient = async () => {
        try {
            const res = await fetch(`/api/clients/${clientId}`)
            if (res.ok) {
                const data = await res.json()
                setClient(data)

                // Populate form states from database
                if (data.complianceDocuments) {
                    setMsmeStatus(data.complianceDocuments.msmeStatus)
                    setDunsStatus(data.complianceDocuments.dunsStatus)
                }
                if (data.playConsoleStatus) {
                    // Load Play Console Setup data
                    setConsoleAccountCreated(data.playConsoleStatus.accountCreated || false)
                    setConsolePaid(data.playConsoleStatus.accountPaid || false)
                    setConsoleIdentityVerified(data.playConsoleStatus.identityVerificationStatus || false)
                    setConsoleCompanyVerified(data.playConsoleStatus.companyVerificationStatus || false)
                    setDeveloperInviteEmail(data.playConsoleStatus.developerInviteEmail || '')
                    setDeveloperInvited(data.playConsoleStatus.developerInvited || false)
                    // For parallel work step
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
                // Load saved parallel work checkbox states from database
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

                // Publishing status
                setPublishingStatus(data.publishingStatus || 'NOT_SUBMITTED')

                // Account sale data
                if (data.playConsoleStatus) {
                    setAccountSaleComplete(data.playConsoleStatus.accountSaleComplete || false)
                    setAccountSaleAmount(data.playConsoleStatus.accountSaleAmount || 0)
                }

                // Organization costs
                if (data.organizationCost) {
                    setOrgCosts({
                        domainCost: data.organizationCost.domainCost || 0,
                        playConsoleFee: data.organizationCost.playConsoleFee || 25,
                        otherCosts: data.organizationCost.otherCosts || 0,
                        costNotes: data.organizationCost.costNotes || ''
                    })
                }

                // Calculate active step
                calculateActiveStep(data)
            }
        } catch (error) {
            console.error('Error fetching client:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateActiveStep = (data: Client) => {
        // Step 1: Client Info - always done
        let step = 2

        // Step 2: MSME
        if (data.complianceDocuments?.msmeStatus === 'APPROVED') {
            step = 3
        } else {
            setActiveStep(2)
            return
        }

        // Step 3: D-U-N-S
        if (data.complianceDocuments?.dunsStatus === 'APPROVED') {
            // After D-U-N-S, steps 4, 5, 6 are ALL parallel - default to step 4
            setActiveStep(4)
            return
        } else {
            setActiveStep(3)
            return
        }
    }

    const saveStep = async (stepNum: number, data: Record<string, unknown>) => {
        setSaving(true)
        const currentStep = activeStep  // Remember current step before fetch
        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: stepNum, data }),
            })
            if (res.ok) {
                await fetchClient()
                // Restore the active step for parallel steps (4, 5, 6)
                if (currentStep >= 4) {
                    setActiveStep(currentStep)
                }
            }
        } catch (error) {
            console.error('Error saving:', error)
        } finally {
            setSaving(false)
        }
    }

    const getStepStatus = (stepId: number) => {
        // Steps 1-3 are sequential
        if (stepId <= 3) {
            if (stepId < activeStep) return 'completed'
            if (stepId === activeStep) return 'current'
            return 'locked'
        }

        // Steps 4, 5, 6 are all parallel after D-U-N-S is approved
        // They are all unlocked once we reach step 4
        if (activeStep >= 4) {
            if (stepId === activeStep) return 'current'
            return 'available'  // All parallel steps are clickable
        }

        return 'locked'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!client) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Client not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader
                title={client.legalName}
                subtitle="Client Workflow"
            />

            <main className="p-6">
                <Link href="/admin/clients">
                    <Button variant="ghost" className="mb-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Clients
                    </Button>
                </Link>

                <div className="flex gap-6">
                    {/* Left Sidebar - Steps */}
                    <div className="w-64 flex-shrink-0">
                        <Card className="sticky top-6">
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-4">Workflow Steps</h3>
                                <div className="space-y-2">
                                    {steps.map((step) => {
                                        const status = getStepStatus(step.id)
                                        const StepIcon = step.icon

                                        return (
                                            <button
                                                key={step.id}
                                                onClick={() => status !== 'locked' && setActiveStep(step.id)}
                                                disabled={status === 'locked'}
                                                className={`w-full text-left p-3 rounded-lg transition-all ${activeStep === step.id
                                                    ? 'bg-blue-100 border-2 border-blue-500'
                                                    : status === 'completed'
                                                        ? 'bg-green-50 hover:bg-green-100'
                                                        : status === 'available'
                                                            ? 'bg-purple-50 hover:bg-purple-100 border border-purple-300 cursor-pointer'
                                                            : 'bg-gray-100 opacity-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500 text-white' :
                                                        activeStep === step.id ? 'bg-blue-500 text-white' :
                                                            status === 'available' ? 'bg-purple-500 text-white' :
                                                                'bg-gray-300 text-gray-500'
                                                        }`}>
                                                        {status === 'completed' ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium text-sm ${status === 'locked' ? 'text-gray-400' : 'text-gray-900'
                                                            }`}>{step.name}</p>
                                                        <p className="text-xs text-gray-500">{step.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Content - Step Details */}
                    <div className="flex-1">
                        {/* Step 1: Client Info */}
                        {activeStep === 1 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-6">Step 1: Client Information</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-500">Legal Name</label>
                                            <p className="font-medium">{client.legalName}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">PAN Number</label>
                                            <p className="font-medium">{client.panNumber}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Company Type</label>
                                            <p className="font-medium">{client.companyType.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Email</label>
                                            <p className="font-medium">{client.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Phone</label>
                                            <p className="font-medium">{client.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button onClick={() => setActiveStep(2)} className="gap-2">
                                            Next: MSME <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: MSME */}
                        {activeStep === 2 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-6">Step 2: MSME Certificate</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">MSME/Udyam Number</label>
                                            <Input
                                                placeholder="UDYAM-XX-00-0000000"
                                                value={msmeNumber}
                                                onChange={(e) => setMsmeNumber(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Status</label>
                                            <div className="flex gap-2">
                                                {['NOT_CREATED', 'PENDING', 'APPROVED'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setMsmeStatus(status)}
                                                        className={`px-4 py-2 rounded-lg border ${msmeStatus === status
                                                            ? status === 'APPROVED' ? 'bg-green-500 text-white border-green-500'
                                                                : status === 'PENDING' ? 'bg-yellow-500 text-white border-yellow-500'
                                                                    : 'bg-gray-500 text-white border-gray-500'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {status.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-700">
                                                💡 Don't have MSME? <a href="https://udyamregistration.gov.in" target="_blank" className="underline">Register here</a> (Free for MSMEs)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <Button variant="outline" onClick={() => setActiveStep(1)}>← Previous</Button>
                                        <Button
                                            onClick={() => saveStep(2, { status: msmeStatus, number: msmeNumber })}
                                            disabled={saving || msmeStatus !== 'APPROVED'}
                                            className="gap-2"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save & Next
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: D-U-N-S */}
                        {activeStep === 3 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-6">Step 3: D-U-N-S Number</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">D-U-N-S Number</label>
                                            <Input
                                                placeholder="00-000-0000"
                                                value={dunsNumber}
                                                onChange={(e) => setDunsNumber(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Status</label>
                                            <div className="flex gap-2">
                                                {['NOT_CREATED', 'PENDING', 'APPROVED'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setDunsStatus(status)}
                                                        className={`px-4 py-2 rounded-lg border ${dunsStatus === status
                                                            ? status === 'APPROVED' ? 'bg-green-500 text-white border-green-500'
                                                                : status === 'PENDING' ? 'bg-yellow-500 text-white border-yellow-500'
                                                                    : 'bg-gray-500 text-white border-gray-500'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {status.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-700">
                                                💡 Get D-U-N-S from <a href="https://www.dnb.com/duns.html" target="_blank" className="underline">Dun & Bradstreet</a>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <Button variant="outline" onClick={() => setActiveStep(2)}>← Previous</Button>
                                        <Button
                                            onClick={() => saveStep(3, { status: dunsStatus, number: dunsNumber })}
                                            disabled={saving || dunsStatus !== 'APPROVED'}
                                            className="gap-2"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save & Next
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 4: Play Console Setup */}
                        {activeStep === 4 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-2">Step 4: Google Play Console Setup</h2>
                                    <p className="text-gray-500 text-sm mb-6">Organization pays $25 to create Play Console account for client</p>

                                    <div className="space-y-6">
                                        {/* Account Creation */}
                                        <div className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium">1. Create Play Console Account</h3>
                                                    <p className="text-sm text-gray-500">Create Google Play Developer account for client</p>
                                                </div>
                                                <button
                                                    onClick={() => setConsoleAccountCreated(!consoleAccountCreated)}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${consoleAccountCreated ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                                                >
                                                    {consoleAccountCreated && <Check className="h-4 w-4 text-white" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Payment */}
                                        <div className="border rounded-lg p-4 bg-green-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-green-800">2. Registration Fee Paid ($25)</h3>
                                                    <p className="text-sm text-green-600">Organization pays Google's $25 one-time fee</p>
                                                </div>
                                                <button
                                                    onClick={() => setConsolePaid(!consolePaid)}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${consolePaid ? 'bg-green-500 border-green-500' : 'border-green-300'}`}
                                                >
                                                    {consolePaid && <Check className="h-4 w-4 text-white" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Identity Verification */}
                                        <div className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium">3. Identity Verified</h3>
                                                    <p className="text-sm text-gray-500">Complete Google's identity verification</p>
                                                </div>
                                                <button
                                                    onClick={() => setConsoleIdentityVerified(!consoleIdentityVerified)}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${consoleIdentityVerified ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                                                >
                                                    {consoleIdentityVerified && <Check className="h-4 w-4 text-white" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Company Verification */}
                                        <div className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium">4. Company Verified</h3>
                                                    <p className="text-sm text-gray-500">Complete business/organization verification</p>
                                                </div>
                                                <button
                                                    onClick={() => setConsoleCompanyVerified(!consoleCompanyVerified)}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${consoleCompanyVerified ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                                                >
                                                    {consoleCompanyVerified && <Check className="h-4 w-4 text-white" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Developer Invite */}
                                        <div className="border rounded-lg p-4 bg-blue-50">
                                            <h3 className="font-medium text-blue-800 mb-3">5. Invite Developer (Full Access)</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-700 mb-1">Developer Email ID</label>
                                                    <Input
                                                        type="email"
                                                        placeholder="developer@shotlin.com"
                                                        value={developerInviteEmail}
                                                        onChange={(e) => setDeveloperInviteEmail(e.target.value)}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm text-blue-600">Invitation sent with admin access</span>
                                                    <button
                                                        onClick={() => setDeveloperInvited(!developerInvited)}
                                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${developerInvited ? 'bg-green-500 border-green-500' : 'border-blue-300'}`}
                                                    >
                                                        {developerInvited && <Check className="h-4 w-4 text-white" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <Button variant="outline" onClick={() => setActiveStep(3)}>← Previous</Button>
                                        <Button
                                            onClick={() => saveStep(4, {
                                                accountCreated: consoleAccountCreated,
                                                accountPaid: consolePaid,
                                                identityVerified: consoleIdentityVerified,
                                                companyVerified: consoleCompanyVerified,
                                                developerEmail: developerInviteEmail,
                                                developerInvited: developerInvited,
                                            })}
                                            disabled={saving || !developerInvited}
                                            className="gap-2"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save & Continue
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 5: Domain */}
                        {activeStep === 5 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-6">Step 5: Domain</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Does client have a domain?</label>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setHasDomain(true)}
                                                    className={`px-6 py-3 rounded-lg border-2 ${hasDomain ? 'border-green-500 bg-green-50' : 'border-gray-200'
                                                        }`}
                                                >
                                                    ✅ Yes, has domain
                                                </button>
                                                <button
                                                    onClick={() => setHasDomain(false)}
                                                    className={`px-6 py-3 rounded-lg border-2 ${!hasDomain ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                                        }`}
                                                >
                                                    🛒 Need to buy
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Domain URL</label>
                                            <Input
                                                placeholder="example.com"
                                                value={domainUrl}
                                                onChange={(e) => setDomainUrl(e.target.value)}
                                            />
                                        </div>

                                        {!hasDomain && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-sm text-yellow-800">
                                                    ⚠️ Buy domain from: <a href="https://www.godaddy.com" target="_blank" className="underline">GoDaddy</a>,
                                                    <a href="https://www.namecheap.com" target="_blank" className="underline ml-1">Namecheap</a>, or
                                                    <a href="https://domains.google" target="_blank" className="underline ml-1">Google Domains</a>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <Button variant="outline" onClick={() => setActiveStep(4)}>← Previous</Button>
                                        <Button
                                            onClick={() => saveStep(5, { url: domainUrl, verified: false })}
                                            disabled={saving || !domainUrl}
                                            className="gap-2"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save & Continue
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 6: Parallel Work */}
                        {activeStep === 6 && (
                            <div className="space-y-6">
                                {/* Header with overall progress */}
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold">Parallel Work Phase</h2>
                                            <p className="text-indigo-100 mt-1">Track progress across all development tasks</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold">
                                                {Math.round((
                                                    (Object.values(websiteStatus).filter(Boolean).length / 3) +
                                                    (Object.values(playConsoleStatus).filter(Boolean).length / 4) +
                                                    (Object.values(appDevStatus).filter(Boolean).length / 3) +
                                                    (Object.values(uploadStatus).filter(Boolean).length / 4)
                                                ) / 4 * 100)}%
                                            </div>
                                            <div className="text-indigo-200 text-sm">Overall Progress</div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-3">
                                        <div
                                            className="bg-white rounded-full h-3 transition-all duration-500"
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

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Website Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <Globe className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h3 className="font-bold text-white text-lg">Website</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${Object.values(websiteStatus).every(Boolean)
                                                    ? 'bg-green-100 text-green-700'
                                                    : Object.values(websiteStatus).some(Boolean)
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {Object.values(websiteStatus).every(Boolean) ? '✓ Complete' :
                                                        Object.values(websiteStatus).some(Boolean) ? '⏳ In Progress' : '○ Not Started'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {[
                                                { key: 'design', label: 'Design Complete', icon: '🎨' },
                                                { key: 'dev', label: 'Development Done', icon: '💻' },
                                                { key: 'searchConsole', label: 'Search Console Linked', icon: '🔗' },
                                            ].map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => setWebsiteStatus({ ...websiteStatus, [item.key]: !websiteStatus[item.key as keyof typeof websiteStatus] })}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${websiteStatus[item.key as keyof typeof websiteStatus]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className={`font-medium ${websiteStatus[item.key as keyof typeof websiteStatus] ? 'text-green-700' : 'text-gray-700'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${websiteStatus[item.key as keyof typeof websiteStatus]
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {websiteStatus[item.key as keyof typeof websiteStatus] && <Check className="h-4 w-4 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Play Console Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <PlayCircle className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h3 className="font-bold text-white text-lg">Play Console</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${Object.values(playConsoleStatus).every(Boolean)
                                                    ? 'bg-green-100 text-green-700'
                                                    : Object.values(playConsoleStatus).some(Boolean)
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {Object.values(playConsoleStatus).every(Boolean) ? '✓ Complete' :
                                                        Object.values(playConsoleStatus).some(Boolean) ? '⏳ In Progress' : '○ Not Started'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {[
                                                { key: 'account', label: 'Account Created', icon: '👤' },
                                                { key: 'identity', label: 'Identity Verified', icon: '🆔' },
                                                { key: 'company', label: 'Company Verified', icon: '🏢' },
                                                { key: 'payment', label: 'Payment Profile', icon: '💳' },
                                            ].map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => setPlayConsoleStatus({ ...playConsoleStatus, [item.key]: !playConsoleStatus[item.key as keyof typeof playConsoleStatus] })}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${playConsoleStatus[item.key as keyof typeof playConsoleStatus]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className={`font-medium ${playConsoleStatus[item.key as keyof typeof playConsoleStatus] ? 'text-green-700' : 'text-gray-700'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${playConsoleStatus[item.key as keyof typeof playConsoleStatus]
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {playConsoleStatus[item.key as keyof typeof playConsoleStatus] && <Check className="h-4 w-4 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* App Development Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <Smartphone className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h3 className="font-bold text-white text-lg">App Development</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${Object.values(appDevStatus).every(Boolean)
                                                    ? 'bg-green-100 text-green-700'
                                                    : Object.values(appDevStatus).some(Boolean)
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {Object.values(appDevStatus).every(Boolean) ? '✓ Complete' :
                                                        Object.values(appDevStatus).some(Boolean) ? '⏳ In Progress' : '○ Not Started'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {[
                                                { key: 'ui', label: 'UI/UX Design', icon: '🎯' },
                                                { key: 'dev', label: 'Development', icon: '⚙️' },
                                                { key: 'testing', label: 'Testing Complete', icon: '✅' },
                                            ].map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => setAppDevStatus({ ...appDevStatus, [item.key]: !appDevStatus[item.key as keyof typeof appDevStatus] })}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${appDevStatus[item.key as keyof typeof appDevStatus]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className={`font-medium ${appDevStatus[item.key as keyof typeof appDevStatus] ? 'text-green-700' : 'text-gray-700'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${appDevStatus[item.key as keyof typeof appDevStatus]
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {appDevStatus[item.key as keyof typeof appDevStatus] && <Check className="h-4 w-4 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* App Upload Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <Upload className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h3 className="font-bold text-white text-lg">App Upload</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${Object.values(uploadStatus).every(Boolean)
                                                    ? 'bg-green-100 text-green-700'
                                                    : Object.values(uploadStatus).some(Boolean)
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {Object.values(uploadStatus).every(Boolean) ? '✓ Complete' :
                                                        Object.values(uploadStatus).some(Boolean) ? '⏳ In Progress' : '○ Not Started'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {[
                                                { key: 'assets', label: 'Assets Ready', icon: '📦' },
                                                { key: 'screenshots', label: 'Screenshots Done', icon: '📸' },
                                                { key: 'privacyPolicy', label: 'Privacy Policy Page', icon: '📄' },
                                                { key: 'uploaded', label: 'APK Uploaded', icon: '☁️' },
                                                { key: 'published', label: 'Published', icon: '🚀' },
                                            ].map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => setUploadStatus({ ...uploadStatus, [item.key]: !uploadStatus[item.key as keyof typeof uploadStatus] })}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${uploadStatus[item.key as keyof typeof uploadStatus]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className={`font-medium ${uploadStatus[item.key as keyof typeof uploadStatus] ? 'text-green-700' : 'text-gray-700'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${uploadStatus[item.key as keyof typeof uploadStatus]
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {uploadStatus[item.key as keyof typeof uploadStatus] && <Check className="h-4 w-4 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Publishing Status Section */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                            <span className="text-white text-lg">📊</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800">Publishing Status</h3>
                                    </div>
                                    <div className="flex gap-3">
                                        {(['NOT_SUBMITTED', 'IN_REVIEW', 'PRODUCTION'] as const).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setPublishingStatus(status)}
                                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${publishingStatus === status
                                                    ? status === 'PRODUCTION'
                                                        ? 'bg-green-500 text-white shadow-lg'
                                                        : status === 'IN_REVIEW'
                                                            ? 'bg-yellow-500 text-white shadow-lg'
                                                            : 'bg-gray-500 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {status === 'NOT_SUBMITTED' && '📝 Not Submitted'}
                                                {status === 'IN_REVIEW' && '⏳ In Review'}
                                                {status === 'PRODUCTION' && '✅ Production'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Account Sale Section */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                            <span className="text-white text-lg">💰</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800">Play Console Account Sale</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setAccountSaleComplete(!accountSaleComplete)}
                                            className={`p-4 rounded-xl border-2 transition-all ${accountSaleComplete
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-emerald-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{accountSaleComplete ? '✅ Sale Complete' : '⏳ Pending'}</span>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${accountSaleComplete
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {accountSaleComplete && <Check className="h-4 w-4 text-white" />}
                                                </div>
                                            </div>
                                        </button>
                                        <div className="p-4 rounded-xl border-2 border-gray-200">
                                            <label className="text-sm text-gray-500 mb-1 block">Buyer Payment Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={accountSaleAmount}
                                                onChange={(e) => setAccountSaleAmount(Number(e.target.value))}
                                                className="w-full text-2xl font-bold text-emerald-600 bg-transparent outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Organization Costs (Liability) Section */}
                                <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl shadow-lg p-6 text-white">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <span className="text-lg">🏢</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Organization Liability</h3>
                                            <p className="text-red-100 text-sm">Costs paid by your company, not client</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="bg-white/10 rounded-xl p-4">
                                            <label className="text-red-100 text-sm block mb-1">Domain Cost (₹)</label>
                                            <input
                                                type="number"
                                                value={orgCosts.domainCost}
                                                onChange={(e) => setOrgCosts({ ...orgCosts, domainCost: Number(e.target.value) })}
                                                className="w-full text-2xl font-bold bg-transparent outline-none text-white placeholder-red-200"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-4">
                                            <label className="text-red-100 text-sm block mb-1">Play Console Fee (₹)</label>
                                            <input
                                                type="number"
                                                value={orgCosts.playConsoleFee}
                                                onChange={(e) => setOrgCosts({ ...orgCosts, playConsoleFee: Number(e.target.value) })}
                                                className="w-full text-2xl font-bold bg-transparent outline-none text-white placeholder-red-200"
                                                placeholder="25"
                                            />
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-4">
                                            <label className="text-red-100 text-sm block mb-1">Other Costs (₹)</label>
                                            <input
                                                type="number"
                                                value={orgCosts.otherCosts}
                                                onChange={(e) => setOrgCosts({ ...orgCosts, otherCosts: Number(e.target.value) })}
                                                className="w-full text-2xl font-bold bg-transparent outline-none text-white placeholder-red-200"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                                        <label className="text-red-100 text-sm block mb-1">Notes</label>
                                        <input
                                            type="text"
                                            value={orgCosts.costNotes}
                                            onChange={(e) => setOrgCosts({ ...orgCosts, costNotes: e.target.value })}
                                            className="w-full bg-transparent outline-none text-white placeholder-red-200"
                                            placeholder="Additional notes about costs..."
                                        />
                                    </div>
                                    <div className="flex items-center justify-between bg-white/20 rounded-xl p-4">
                                        <span className="font-medium">Total Liability</span>
                                        <span className="text-3xl font-bold">
                                            ₹{(orgCosts.domainCost + orgCosts.playConsoleFee + orgCosts.otherCosts).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => {
                                            saveStep(6, {
                                                consoleEmail: client.email,
                                                website: websiteStatus,
                                                playConsole: playConsoleStatus,
                                                appDev: appDevStatus,
                                                upload: uploadStatus,
                                                publishingStatus: publishingStatus,
                                                accountSale: {
                                                    complete: accountSaleComplete,
                                                    amount: accountSaleAmount,
                                                },
                                                orgCosts: orgCosts,
                                            })
                                        }}
                                        disabled={saving}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all gap-3"
                                    >
                                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        Save Progress
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
