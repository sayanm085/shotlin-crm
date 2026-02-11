import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Helper to check ownership
async function checkOwnership(clientId: string, userId: string, role: string) {
    if (role === 'SUPER_ADMIN') return true

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
            createdById: true,
            user: { select: { id: true } }
        }
    })

    if (!client) return false // Let main logic handle 404

    // Allow if Creator OR Assigned Member
    if (client.createdById === userId) return true
    if (client.user?.id === userId) return true

    return false
}

// GET single client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    try {
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                complianceDocuments: true,
                playConsoleStatus: true,
                websiteTasks: true,
                appDevelopmentTasks: true,
                playStoreAssets: true,
                submissionReview: true,
                paymentMilestones: true,
                organizationCost: true,
                user: { select: { id: true } },
            },
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Check ownership (creator or assigned member)
        if (session.user.role !== 'SUPER_ADMIN' && client.createdById !== session.user.id && client.user?.id !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }
}

import { z } from 'zod'

// Shared schemas
const stepSchema = z.number().min(1).max(7)

// Step 1: Client Info
const clientInfoSchema = z.object({
    name: z.string().min(2),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
    type: z.enum(['INDIVIDUAL', 'FIRM', 'PVT_LTD']),
    email: z.string().email(),
    phone: z.string().optional(),
})

// Step 2 & 3: Compliance
const complianceSchema = z.object({
    status: z.enum(['NOT_CREATED', 'PENDING', 'APPROVED']),
    documentUrl: z.string().nullable().optional(),
    number: z.string().optional(),
})

// Step 4: Play Console
const playConsoleSchema = z.object({
    accountCreated: z.boolean().optional(),
    accountPaid: z.boolean().optional(),
    identityVerified: z.boolean().optional(),
    companyVerified: z.boolean().optional(),
    developerEmail: z.string().email().optional().nullable(),
    developerInvited: z.boolean().optional(),
})

// Step 5: Domain
const domainSchema = z.object({
    url: z.string().optional().or(z.literal('')), // Relaxed validation to allow non-protocol URLs like "example.com"
    verified: z.boolean().optional(),
})

// Step 6: Parallel (Complex) - defaulting to partial/pass-through specific typed checks would be huge.
// Using loose schema for Step 6 to avoid breaking complex existing nested logic, but enforcing structure.
const parallelWorkSchema = z.object({
    playConsole: z.object({ payment: z.boolean() }).optional(),
    accountSale: z.object({ complete: z.boolean(), amount: z.number().nullable() }).optional(),
    website: z.object({ design: z.boolean(), dev: z.boolean(), searchConsole: z.boolean() }).optional(),
    appDev: z.object({ ui: z.boolean(), dev: z.boolean(), testing: z.boolean() }).optional(),
    upload: z.object({
        assets: z.boolean(),
        assetsUrl: z.string().optional().nullable(),
        screenshots: z.boolean(),
        uploaded: z.boolean(),
        apkUrl: z.string().optional().nullable(),
        published: z.boolean(),
        privacyPolicy: z.boolean(),
        privacyPolicyUrl: z.string().optional().nullable()
    }).optional(),
    publishingStatus: z.enum(['NOT_SUBMITTED', 'IN_REVIEW', 'PRODUCTION']).optional(),
    orgCosts: z.object({ domainCost: z.number(), playConsoleFee: z.number(), otherCosts: z.number(), costNotes: z.string().nullable() }).optional(),
})


// PUT update client workflow
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Ownership check — single fetch, no race condition
    const existing = await prisma.client.findUnique({ where: { id }, select: { id: true, createdById: true, user: { select: { id: true } } } })
    if (!existing) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    if (session.user.role !== 'SUPER_ADMIN' && existing.createdById !== session.user.id && existing.user?.id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { step } = body

        // Validate step
        const stepValidation = stepSchema.safeParse(step)
        if (!stepValidation.success) {
            return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
        }


        let data = body.data

        switch (step) {
            case 1: // Client Info
                const v1 = clientInfoSchema.safeParse(data)
                if (!v1.success) return NextResponse.json({ error: v1.error.issues[0].message }, { status: 400 })
                data = v1.data // Typed data

                await prisma.client.update({
                    where: { id },
                    data: {
                        legalName: data.name,
                        panNumber: data.pan,
                        companyType: data.type,
                        email: data.email,
                        phone: data.phone,
                    },
                })
                return NextResponse.json({ success: true })

            case 2: // MSME
                const v2 = complianceSchema.safeParse(data)
                if (!v2.success) return NextResponse.json({ error: v2.error.issues[0].message }, { status: 400 })
                data = v2.data

                await prisma.complianceDocument.update({
                    where: { clientId: id },
                    data: {
                        msmeStatus: data.status,
                        msmeDocumentUrl: data.documentUrl || null,
                        msmeRegistrationNumber: data.number || null,
                        lastVerifiedAt: new Date(),
                    },
                })
                return NextResponse.json({ success: true })

            case 3: // D-U-N-S
                const v3 = complianceSchema.safeParse(data)
                if (!v3.success) return NextResponse.json({ error: v3.error.issues[0].message }, { status: 400 })
                data = v3.data

                await prisma.complianceDocument.update({
                    where: { clientId: id },
                    data: {
                        dunsStatus: data.status,
                        dunsDocumentUrl: data.documentUrl || null,
                        dunsNumber: data.number || null,
                        lastVerifiedAt: new Date(),
                    },
                })
                return NextResponse.json({ success: true })

            case 4: // Review & Submit
                // No data save needed for this read-only step, but allow purely for step navigation updates if needed
                return NextResponse.json({ success: true })

            case 5: // Play Console Setup
                const v5 = playConsoleSchema.safeParse(data)
                if (!v5.success) return NextResponse.json({ error: v5.error.issues[0].message }, { status: 400 })
                data = v5.data

                await prisma.playConsoleStatus.update({
                    where: { clientId: id },
                    data: {
                        accountCreated: data.accountCreated || false,
                        accountPaid: data.accountPaid || false,
                        identityVerificationStatus: data.identityVerified || false,
                        companyVerificationStatus: data.companyVerified || false,
                        developerInviteEmail: data.developerEmail || null,
                        developerInvited: data.developerInvited || false,
                        consoleReady: data.accountCreated && data.identityVerified && data.companyVerified && data.developerInvited,
                    },
                })
                return NextResponse.json({ success: true, message: 'Play Console setup saved' })

            case 6: // Domain
                const v6 = domainSchema.safeParse(data)
                if (!v6.success) return NextResponse.json({ error: v6.error.issues[0].message }, { status: 400 })
                data = v6.data

                await prisma.client.update({
                    where: { id },
                    data: {
                        websiteUrl: data.url || null,
                        websiteVerified: data.verified || false,
                    },
                })
                return NextResponse.json({ success: true })

            case 7: // Parallel Work - Website, Play Console, App Dev, Upload
                const v7 = parallelWorkSchema.safeParse(data)
                if (!v7.success) return NextResponse.json({ error: v7.error.issues[0].message }, { status: 400 })
                data = v7.data

                // Update Play Console Status for payment profile and account sale
                // Only touch fields that are explicitly provided
                if (data.playConsole || data.accountSale !== undefined) {
                    const pcUpdate: Record<string, unknown> = {}
                    if (data.playConsole) {
                        pcUpdate.paymentProfileStatus = data.playConsole.payment || false
                    }
                    if (data.accountSale) {
                        pcUpdate.accountSaleComplete = data.accountSale.complete || false
                        pcUpdate.accountSaleAmount = data.accountSale.amount || null
                    }
                    await prisma.playConsoleStatus.upsert({
                        where: { clientId: id },
                        create: {
                            clientId: id,
                            ...pcUpdate,
                        },
                        update: pcUpdate,
                    })
                }

                // Build client update payload conditionally — only touch sections that were sent
                const clientUpdate: Record<string, unknown> = {}

                if (data.website) {
                    clientUpdate.websiteDesignDone = data.website.design || false
                    clientUpdate.websiteDevDone = data.website.dev || false
                    clientUpdate.websiteSearchConsoleDone = data.website.searchConsole || false
                    clientUpdate.websiteVerified = data.website.searchConsole || false
                }

                if (data.appDev) {
                    clientUpdate.appUiDone = data.appDev.ui || false
                    clientUpdate.appDevDone = data.appDev.dev || false
                    clientUpdate.appTestingDone = data.appDev.testing || false
                    clientUpdate.appApproved = data.appDev.testing || false
                }

                if (data.upload) {
                    clientUpdate.uploadAssetsDone = data.upload.assets || false
                    clientUpdate.assetsUrl = data.upload.assetsUrl || null
                    clientUpdate.uploadScreenshotsDone = data.upload.screenshots || false
                    clientUpdate.uploadApkDone = data.upload.uploaded || false
                    clientUpdate.apkUrl = data.upload.apkUrl || null
                    clientUpdate.published = data.upload.published || false
                    clientUpdate.privacyPolicyDone = data.upload.privacyPolicy || false
                    clientUpdate.privacyPolicyUrl = data.upload.privacyPolicyUrl || null
                }

                if (data.publishingStatus) {
                    clientUpdate.publishingStatus = data.publishingStatus
                }

                // Only update if there are fields to update
                if (Object.keys(clientUpdate).length > 0) {
                    await prisma.client.update({
                        where: { id },
                        data: clientUpdate,
                    })
                }

                // Update Organization Costs (liability)
                if (data.orgCosts) {
                    await prisma.organizationCost.upsert({
                        where: { clientId: id },
                        create: {
                            clientId: id,
                            domainCost: data.orgCosts.domainCost || 0,
                            playConsoleFee: data.orgCosts.playConsoleFee || 0,
                            otherCosts: data.orgCosts.otherCosts || 0,
                            costNotes: data.orgCosts.costNotes || null,
                        },
                        update: {
                            domainCost: data.orgCosts.domainCost || 0,
                            playConsoleFee: data.orgCosts.playConsoleFee || 0,
                            otherCosts: data.orgCosts.otherCosts || 0,
                            costNotes: data.orgCosts.costNotes || null,
                        },
                    })
                }

                return NextResponse.json({ success: true, message: 'Parallel work saved' })

            default:
                return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
        }
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

// PATCH update client status (e.g., submission)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Ownership check — single fetch, no race condition
    const existing = await prisma.client.findUnique({ where: { id }, select: { id: true, createdById: true, user: { select: { id: true } } } })
    if (!existing) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    if (session.user.role !== 'SUPER_ADMIN' && existing.createdById !== session.user.id && existing.user?.id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { onboardingStatus } = body

        if (!['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].includes(onboardingStatus)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        await prisma.client.update({
            where: { id },
            data: { onboardingStatus },
        })

        return NextResponse.json({ success: true, message: 'Status updated' })
    } catch (error) {
        console.error('Error upgrading client status:', error)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }
}

// DELETE client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Ownership check — single fetch, no race condition
    const existing = await prisma.client.findUnique({ where: { id }, select: { id: true, createdById: true, user: { select: { id: true } } } })
    if (!existing) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    if (session.user.role !== 'SUPER_ADMIN' && existing.createdById !== session.user.id && existing.user?.id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
        await prisma.client.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
