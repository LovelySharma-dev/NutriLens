import prisma from "../config/database.js";

export interface CreateScanInput {
    userId?: string
    imageUrl?: string
}

export async function createScan(input: CreateScanInput) {
    return prisma.scan.create({
        data: {
            userId: input.userId,
            imageUrl: input.imageUrl,
            status: "PENDING"
        }
    })
}

export async function getScanById(scanId:string) {
    return prisma.scan.findUnique({
        where: {
            id: scanId
        },
        include: {
            labelData: {
                include: {
                    ingredients: true,
                    nutritionFacts: true,
                    claims: true
                
            },
        }, 
        report: {
            include: {
                trustScore: true
            }
        }
    }
  })
}

export async function getRecentScans(limit = 20) {
    return prisma.scan.findMany({
        orderBy: {
            createdAt: "desc"
        },
        take: limit,
        include: {
            labelData: true,
            report: true
        }
    })
}