import prisma from "../config/database.js";

export interface CreateLabelDataInput {
    scanId: string
    productName?: string
    brand?: string
    rawOcrText?: string
}

export async function createLabelData(input: CreateLabelDataInput) {
    return prisma.labelData.create({
        data: {
            scanId: input.scanId,
            productName: input.productName,
            brand: input.brand,
            rawOcrText: input.rawOcrText
        }
    })
}

export async function getLabelDataByScanId(scanId: string) {
    return prisma.labelData.findUnique({
        where: {
            scanId,
        },
        include: {
            ingredients: {
                orderBy: {
                    position: "asc"
                }
            },
            nutritionFacts: true,
            claims: {
                include: {
                    verifications: {
                        include: {
                            evidence: true
                        }
                    }
                }
            }

        },
        
    })
}