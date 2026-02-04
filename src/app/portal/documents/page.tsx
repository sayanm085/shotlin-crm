'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Upload,
    FileText,
    Image,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
} from 'lucide-react'

const requiredDocuments = [
    {
        id: 'msme',
        name: 'MSME Certificate',
        description: 'Udyam Registration Certificate',
        status: 'APPROVED',
        uploadedAt: '2024-01-20',
        fileName: 'msme_certificate.pdf',
    },
    {
        id: 'duns',
        name: 'D-U-N-S Document',
        description: 'Dun & Bradstreet Number Certificate',
        status: 'PENDING',
        uploadedAt: null,
        fileName: null,
    },
    {
        id: 'long_desc',
        name: 'Long Description',
        description: 'Play Store long description (SEO-optimized, max 4000 chars)',
        status: 'NOT_STARTED',
        uploadedAt: null,
        fileName: null,
    },
    {
        id: 'feature_graphic',
        name: 'Feature Graphic',
        description: '1024x500 PNG or JPEG',
        status: 'NOT_STARTED',
        uploadedAt: null,
        fileName: null,
    },
    {
        id: 'screenshots',
        name: 'Screenshots',
        description: 'Minimum 6 screenshots (phone, 7-inch tablet, 10-inch tablet)',
        status: 'NOT_STARTED',
        uploadedAt: null,
        fileName: null,
    },
]

export default function DocumentsPage() {
    const [dragOver, setDragOver] = useState<string | null>(null)

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Upload Documents</h1>
                    <p className="text-sm text-gray-500">Submit required documents and assets</p>
                </div>
            </header>

            <main className="p-6">
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="py-4 flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold text-green-700">
                                    {requiredDocuments.filter(d => d.status === 'APPROVED').length}
                                </p>
                                <p className="text-sm text-green-600">Approved</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="py-4 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold text-yellow-700">
                                    {requiredDocuments.filter(d => d.status === 'PENDING').length}
                                </p>
                                <p className="text-sm text-yellow-600">Under Review</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="py-4 flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                            <div>
                                <p className="text-2xl font-bold text-gray-700">
                                    {requiredDocuments.filter(d => d.status === 'NOT_STARTED').length}
                                </p>
                                <p className="text-sm text-gray-600">Required</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Documents List */}
                <div className="space-y-4">
                    {requiredDocuments.map((doc) => (
                        <Card
                            key={doc.id}
                            className={
                                doc.status === 'APPROVED'
                                    ? 'border-green-200 bg-green-50/30'
                                    : doc.status === 'PENDING'
                                        ? 'border-yellow-200 bg-yellow-50/30'
                                        : 'border-gray-200'
                            }
                        >
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.id === 'screenshots' || doc.id === 'feature_graphic'
                                                ? 'bg-purple-100'
                                                : 'bg-blue-100'
                                            }`}>
                                            {doc.id === 'screenshots' || doc.id === 'feature_graphic' ? (
                                                <Image className="h-6 w-6 text-purple-600" />
                                            ) : (
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                                                <Badge
                                                    variant={
                                                        doc.status === 'APPROVED'
                                                            ? 'success'
                                                            : doc.status === 'PENDING'
                                                                ? 'warning'
                                                                : 'secondary'
                                                    }
                                                >
                                                    {doc.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                                            {doc.fileName && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Uploaded: {doc.fileName} • {doc.uploadedAt}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        {doc.status === 'APPROVED' ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle className="h-5 w-5" />
                                                <span className="text-sm font-medium">Verified</span>
                                            </div>
                                        ) : doc.status === 'PENDING' ? (
                                            <div className="flex items-center gap-2 text-yellow-600">
                                                <Clock className="h-5 w-5" />
                                                <span className="text-sm font-medium">Under Review</span>
                                            </div>
                                        ) : (
                                            <div
                                                className={`w-48 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${dragOver === doc.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                    }`}
                                                onDragOver={(e) => {
                                                    e.preventDefault()
                                                    setDragOver(doc.id)
                                                }}
                                                onDragLeave={() => setDragOver(null)}
                                                onDrop={(e) => {
                                                    e.preventDefault()
                                                    setDragOver(null)
                                                    // Handle file upload
                                                }}
                                            >
                                                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-500">Drop file or click</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        // Handle file upload
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Text Input for Long Description */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Long Description Text</CardTitle>
                        <CardDescription>
                            Enter your Play Store long description directly (max 4000 characters)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your app's long description here. This should be SEO-optimized and clearly explain your app's features and benefits..."
                        />
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-sm text-gray-500">0 / 4000 characters</span>
                            <Button>Save Description</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Guidelines */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <h3 className="font-semibold text-blue-900 mb-2">📋 Upload Guidelines</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• MSME/D-U-N-S: PDF format, max 5MB</li>
                            <li>• Feature Graphic: 1024x500 pixels, PNG or JPEG</li>
                            <li>• Screenshots: Minimum 6, recommended sizes for phone and tablet</li>
                            <li>• All uploads are verified before being marked as approved</li>
                            <li>• Rejected uploads will show the reason for rejection</li>
                        </ul>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
