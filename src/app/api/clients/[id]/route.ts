import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

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
            },
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }
}

// PUT update client workflow
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const body = await request.json()
        const { step, data } = body

        console.log('Saving step:', step, 'data:', JSON.stringify(data))

        switch (step) {
            case 1: // Client Info
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
                await prisma.complianceDocument.update({
                    where: { clientId: id },
                    data: {
                        msmeStatus: data.status,
                        msmeDocumentUrl: data.documentUrl || null,
                        lastVerifiedAt: new Date(),
                    },
                })
                return NextResponse.json({ success: true })

            case 3: // D-U-N-S
                await prisma.complianceDocument.update({
                    where: { clientId: id },
                    data: {
                        dunsStatus: data.status,
                        dunsDocumentUrl: data.documentUrl || null,
                        lastVerifiedAt: new Date(),
                    },
                })
                return NextResponse.json({ success: true })

            case 4: // Play Console Setup
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

            case 5: // Domain
                await prisma.client.update({
                    where: { id },
                    data: {
                        websiteUrl: data.url,
                        websiteVerified: data.verified || false,
                    },
                })
                return NextResponse.json({ success: true })

            case 6: // Parallel Work - Website, Play Console, App Dev, Upload
                // Update Play Console Status for payment profile and account sale
                if (data.playConsole || data.accountSale !== undefined) {
                    await prisma.playConsoleStatus.upsert({
                        where: { clientId: id },
                        create: {
                            clientId: id,
                            consoleEmail: data.consoleEmail || null,
                            paymentProfileStatus: data.playConsole?.payment || false,
                            accountSaleComplete: data.accountSale?.complete || false,
                            accountSaleAmount: data.accountSale?.amount || null,
                        },
                        update: {
                            consoleEmail: data.consoleEmail || null,
                            paymentProfileStatus: data.playConsole?.payment || false,
                            accountSaleComplete: data.accountSale?.complete || false,
                            accountSaleAmount: data.accountSale?.amount || null,
                        },
                    })
                }

                // Update Client with all parallel work checkboxes
                await prisma.client.update({
                    where: { id },
                    data: {
                        // Website checkboxes
                        websiteDesignDone: data.website?.design || false,
                        websiteDevDone: data.website?.dev || false,
                        websiteSearchConsoleDone: data.website?.searchConsole || false,
                        websiteVerified: data.website?.searchConsole || false,

                        // App Development checkboxes
                        appUiDone: data.appDev?.ui || false,
                        appDevDone: data.appDev?.dev || false,
                        appTestingDone: data.appDev?.testing || false,
                        appApproved: data.appDev?.testing || false,

                        // Upload checkboxes
                        uploadAssetsDone: data.upload?.assets || false,
                        uploadScreenshotsDone: data.upload?.screenshots || false,
                        uploadApkDone: data.upload?.uploaded || false,
                        published: data.upload?.published || false,
                        privacyPolicyDone: data.upload?.privacyPolicy || false,

                        // Publishing status
                        publishingStatus: data.publishingStatus || 'NOT_SUBMITTED',
                    },
                })

                // Update Organization Costs (liability)
                if (data.orgCosts) {
                    await prisma.organizationCost.upsert({
                        where: { clientId: id },
                        create: {
                            clientId: id,
                            domainCost: data.orgCosts.domainCost || 0,
                            playConsoleFee: data.orgCosts.playConsoleFee || 25,
                            otherCosts: data.orgCosts.otherCosts || 0,
                            costNotes: data.orgCosts.costNotes || null,
                        },
                        update: {
                            domainCost: data.orgCosts.domainCost || 0,
                            playConsoleFee: data.orgCosts.playConsoleFee || 25,
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

// DELETE client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

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
