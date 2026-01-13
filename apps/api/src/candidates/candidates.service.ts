import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalAtsService } from '../integrations/external-ats.service';

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private externalAts: ExternalAtsService,
  ) {}

  async syncFromAts() {
    const externalCandidates = await this.externalAts.getCandidates();

    const results = [];
    for (const extCandidate of externalCandidates) {
      const candidate = await this.prisma.candidate.create({
        data: {
          externalId: extCandidate.externalId,
          email: extCandidate.email,
          firstName: extCandidate.firstName,
          lastName: extCandidate.lastName,
        },
      });
      results.push(candidate);
    }

    return {
      message: `Synced ${results.length} candidates`,
      count: results.length,
    };
  }

  async getRecruiterDashboard() {
    const candidates = await this.prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const candidatesWithApplications = await Promise.all(
      candidates.map(async (candidate) => {
        const applications = await this.prisma.application.findMany({
          where: { candidateId: candidate.id },
          orderBy: { createdAt: 'desc' },
        });

        const applicationsWithNotes = await Promise.all(
          applications.map(async (application) => {
            const notes = await this.prisma.interviewNote.findMany({
              where: { applicationId: application.id },
            });

            return {
              ...application,
              interviewNotes: notes,
            };
          }),
        );

        let averageScore = null;
        const allNotes = applicationsWithNotes.flatMap((app) => app.interviewNotes);
        
        if (allNotes.length > 0) {
          const totalScore = allNotes.reduce((sum, note) => {
            return (
              sum +
              note.technicalScore +
              note.communicationScore +
              note.problemSolvingScore +
              note.culturalFitScore
            );
          }, 0);
          averageScore = totalScore / (allNotes.length * 4); // 4 scores per note
        }

        return {
          ...candidate,
          applications: applicationsWithNotes,
          averageScore: averageScore !== null ? Math.round(averageScore * 100) / 100 : null,
        };
      }),
    );

    const totalCount = await this.prisma.candidate.count();

    return {
      candidates: candidatesWithApplications,
      total: totalCount
    };
  }
}
