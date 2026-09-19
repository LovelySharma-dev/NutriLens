import prisma from "../config/database.js";

export async function calculateTrustScore(reportId: string) {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    include: {
      scan: {
        include: {
          labelData: {
            include: {
              claims: {
                include: {
                  verifications: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }
  const verifications =
    report.scan.labelData?.claims.flatMap((claim) => claim.verifications) ?? [];

  if (verifications.length === 0) {
    return prisma.trustScore.upsert({
      where: {
        reportId,
      },
      update: {
        overallScore: null,
        confidence: 0,
        methodology: "No claim verifications available.",
      },
      create: {
        reportId,
        overallScore: null,
        confidence: 0,
        methodology: "No claim verifications available.",
      },
    });
  }

  const statusScores = {
    VERIFIED: 1,
    UNCERTAIN: 0.5,
    FLAGGED: 0,
  } as const;

  const scores = verifications.map(
    (verification) => verification.score ?? statusScores[verification.status],
  );

  const overallScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const confidence =
    verifications.length > 0 ? Math.min(verifications.length / 5, 1) : 0;

  return prisma.trustScore.upsert({
    where: {
      reportId,
    },
    update: {
      overallScore,
      confidence,
      methodology:
        "Average verification score across available claim evidence.",
    },
    create: {
      reportId,
      overallScore,
      confidence,
      methodology:
        "Average verification score across available claim evidence.",
    },
  });
}


export async function getTrustScore(reportId: string) {
  return prisma.trustScore.findUnique({
    where: {
      reportId,
    },
  });
}
