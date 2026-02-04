import "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
    interface User {
        role?: UserRole
        clientId?: string | null
    }

    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            role: "SUPER_ADMIN" | "TEAM_MEMBER" | "CLIENT"
            clientId: string | null
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: UserRole
        clientId?: string | null
    }
}

