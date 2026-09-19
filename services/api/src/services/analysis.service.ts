import prisma from "../config/database.js";
import { calculateTrustScore } from "./trust.service.js";

export async function analyzeScan(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      labelData: {
        include: {
          ingredients: true,
          nutritionFacts: true,
          claims: {
            include: {
              verifications: true,
            },
          },
        },
      },
      report: true,
    },
  });

  if (!scan) {
    throw new Error("Scan not found");
  }

  if (!scan.labelData) {
    throw new Error("Label data not found for this scan");
  }

  const claims = scan.labelData.claims;

  const verificationScores = claims.flatMap((claim) =>
    claim.verifications.map(
      (verification) =>
        verification.score ??
        ({
          VERIFIED: 1,
          UNCERTAIN: 0.5,
          FLAGGED: 0,
        } as const)[verification.status],
    ),
  );

  const averageScore =
    verificationScores.length > 0
      ? verificationScores.reduce((sum, score) => sum + score, 0) /
        verificationScores.length
      : null;

  let riskLevel = "UNKNOWN";

  if (averageScore !== null) {
    if (averageScore >= 0.8) {
      riskLevel = "LOW";
    } else if (averageScore >= 0.5) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "HIGH";
    }
  }

  const flaggedClaims = claims.filter((claim) =>
    claim.verifications.some(
      (verification) => verification.status === "FLAGGED",
    ),
  );

  const recommendations: string[] = [];

  if (flaggedClaims.length > 0) {
    recommendations.push(
      "Review claims flagged during evidence verification.",
    );
  }

  if (claims.length === 0) {
    recommendations.push(
      "No claims were detected. Additional label analysis may be required.",
    );
  }

  if (scan.labelData.nutritionFacts.length === 0) {
    recommendations.push(
      "Nutrition information was not available in the extracted label data.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "No immediate verification issues were identified.",
    );
  }

  const summary =
    claims.length > 0
      ? `Analyzed ${claims.length} label claim(s) using available evidence verification.`
      : "Label analysis completed, but no claims were available for verification.";

  const report = await prisma.report.upsert({
    where: {
      scanId,
    },
    update: {
      summary,
      riskLevel,
      recommendations,
    },
    create: {
      scanId,
      summary,
      riskLevel,
      recommendations,
    },
  });

  const trustScore = await calculateTrustScore(report.id);

  return {
    scanId,
    report,
    trustScore,
    analysis: {
      claimsAnalyzed: claims.length,
      verificationsAnalyzed: verificationScores.length,
      flaggedClaims: flaggedClaims.length,
      averageScore,
      riskLevel,
    },
  };
}