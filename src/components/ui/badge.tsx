import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-gray-900 text-white",
                secondary:
                    "border-transparent bg-gray-100 text-gray-900",
                destructive:
                    "border-transparent bg-red-100 text-red-700",
                success:
                    "border-transparent bg-green-100 text-green-700",
                warning:
                    "border-transparent bg-yellow-100 text-yellow-700",
                info:
                    "border-transparent bg-blue-100 text-blue-700",
                outline:
                    "text-gray-700 border-gray-300",
                // Status-specific variants
                not_started:
                    "border-gray-300 bg-gray-100 text-gray-600",
                pending_client:
                    "border-yellow-300 bg-yellow-100 text-yellow-800",
                pending_verification:
                    "border-orange-300 bg-orange-100 text-orange-800",
                in_progress:
                    "border-blue-300 bg-blue-100 text-blue-800",
                completed:
                    "border-green-300 bg-green-100 text-green-800",
                failed:
                    "border-red-300 bg-red-100 text-red-800",
                blocked:
                    "border-red-400 bg-red-100 text-red-800",
                // Responsibility variants
                client:
                    "border-orange-400 bg-orange-50 text-orange-800",
                company:
                    "border-blue-400 bg-blue-50 text-blue-800",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
