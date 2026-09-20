import prisma from "../config/database.js";

export interface CreateEvidenceInput {
  title: string;
  source?: string;
  url?: string;
  type: "RESEARCH" | "REGULATION" | "DATABASE" | "MANUFACTURER" | "OTHER";
  description?: string;
}

export async function createEvidence(input: CreateEvidenceInput) {
  return prisma.evidence.create({
    data: {
      title: input.title,
      source: input.source,
      url: input.url,
      type: input.type,
      description: input.description,
      retrievedAt: new Date(),
    },
  });
}

export async function getEvidenceById(evidenceId: string) {
  return prisma.evidence.findUnique({
    where: {
      id: evidenceId,
    },
    include: {
      verifications: {
        include: {
          claim: true,
        },
      },
    },
  });
}

export async function getEvidence() {
  return prisma.evidence.findMany({
    orderBy: {
      retrievedAt: "desc",
    },
  });
}
