import prisma from "../config/database.js";

export interface CreateVerificationInput {
    claimId: string
    evidenceId: string
    status: "VERIFIED" | "FLAGGED" | "UNCERTAIN"
    score?: number
    explanation?: string
}

export async function createVerification(input: CreateVerificationInput) {
    return prisma.verification.create({
        data: {
            claimId: input.claimId,
            evidenceId: input.evidenceId,
            status: input.status,
            score: input.score,
            explanation: input.explanation
        },
        include: {
            claim: true,
            evidence: true
        }
    })
}

export async function getVerificationById(verificationId: string) {
    return prisma.verification.findUnique({
        where: {
            id: verificationId
        },
        include: {
            claim: true,
            evidence: true
        }
    })
}

export async function getVerificationByClaimId(claimId: string) {
    return prisma.verification.findMany({
        where: {
            claimId
        },
        include: {
            evidence: true
        },
        orderBy: {
            createdAt: "desc"
        }
    })
    
}