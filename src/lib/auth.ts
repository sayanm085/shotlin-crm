import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { compare } from "bcryptjs"

export type UserRole = "SUPER_ADMIN" | "TEAM_MEMBER" | "CLIENT"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("[AUTH] Authorize called with email:", credentials?.email)

                if (!credentials?.email || !credentials?.password) {
                    console.log("[AUTH] Missing credentials")
                    return null
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                    })

                    console.log("[AUTH] User found:", user ? { id: user.id, email: user.email, role: user.role } : null)

                    if (!user || !user.password) {
                        console.log("[AUTH] No user or no password")
                        return null
                    }

                    // Check if user is active
                    if (!user.isActive) {
                        console.log("[AUTH] User is not active")
                        return null
                    }

                    const isPasswordValid = await compare(
                        credentials.password as string,
                        user.password
                    )

                    console.log("[AUTH] Password valid:", isPasswordValid)

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        clientId: user.clientId,
                    }
                } catch (error) {
                    console.error("[AUTH] Error during authorization:", error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.clientId = user.clientId
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!
                session.user.role = token.role as UserRole
                session.user.clientId = token.clientId as string | null
            }
            return session
        },
    },
})

// Helper functions for auth checks
export async function getServerSession() {
    return await auth()
}

export async function requireAuth() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Unauthorized')
    }
    return session.user
}

export async function requireSuperAdmin() {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN') {
        throw new Error('Forbidden: Super Admin access required')
    }
    return user
}

export async function requireAdmin() {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'TEAM_MEMBER') {
        throw new Error('Forbidden: Admin access required')
    }
    return user
}

