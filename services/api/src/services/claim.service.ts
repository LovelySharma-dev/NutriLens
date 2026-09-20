import prisma from "../config/database.js";

export interface CreateClaimInput {
    labelDataId: string
    text: string
    category?: string
    confidence?: number
}

export async function createClaim(input: CreateClaimInput) {
    return prisma.claim.create({
        data: {
            labelDataId: input.labelDataId,
            text: input.text,
            category: input.category,
            confidence: input.confidence
        }
    })
}

export async function getClaimsByLabelDataId(labelDataId: string) {
    return prisma.claim.findMany({
        where: {
            labelDataId
        },
        include: {
            verifications: {
                include: {
                    evidence: true
                }
            }
        }
    })
}