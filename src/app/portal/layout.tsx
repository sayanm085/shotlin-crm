import { ClientSidebar } from '@/components/client/sidebar'

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <ClientSidebar />
            <div className="pl-64">
                {children}
            </div>
        </div>
    )
}
