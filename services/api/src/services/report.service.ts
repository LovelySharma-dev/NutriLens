import prisma from "../config/database.js";

export interface CreateReportInput {
  scanId: string;
  summary?: string;
  riskLevel?: string;
  recommendations?: string[];
}

export async function createReport(input: CreateReportInput) {
  return prisma.report.create({
    data: {
      scanId: input.scanId,
      summary: input.summary,
      riskLevel: input.riskLevel,
      recommendations: input.recommendations,
    },
  });
}


export async function getReportByScanId(scanId: string) {
  return prisma.report.findUnique({
    where: {
      scanId,
    },
    include: {
      trustScore: true,
      scan: {
        include: {
          labelData: {
            include: {
              ingredients: true,
              nutritionFacts: true,
              claims: {
                include: {
                  verifications: {
                    include: {
                      evidence: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}