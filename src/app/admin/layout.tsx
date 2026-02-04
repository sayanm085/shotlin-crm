import { AdminSidebar } from '@/components/admin/sidebar'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="hidden md:block">
                <AdminSidebar />
            </div>
            <div className="md:pl-64 transition-all duration-300">
                {children}
            </div>
        </div>
    )
}
