import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalAtsService } from '../integrations/external-ats.service';

type DashboardQuery = {
  limit?: number;
  offset?: number;
};

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private externalAts: ExternalAtsService,
  ) {}

  async syncFromAts() {
    // Cross-process lock (works even if API scales horizontally)
    const lockKey = 941337; // arbitrary, stable
    const lockRows = await this.prisma.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_lock(${lockKey}) as locked
    `;
    const locked = lockRows?.[0]?.locked === true;
    if (!locked) {
      throw new ConflictException('Sync already in progress. Please try again shortly.');
    }

    try {
      const externalCandidates = await this.withRetry(
        () => this.externalAts.getCandidates(),
        { attempts: 3, baseDelayMs: 400 },
      );

      // Idempotent upsert by externalId; transactional to avoid partial writes.
      await this.prisma.$transaction(
        externalCandidates.map((ext) =>
          this.prisma.candidate.upsert({
            where: { externalId: ext.externalId },
            create: {
              externalId: ext.externalId,
              email: ext.email,
              firstName: ext.firstName,
              lastName: ext.lastName,
            },
            update: {
              email: ext.email,
              firstName: ext.firstName,
              lastName: ext.lastName,
            },
          }),
        ),
      );

      return {
        message: `Upserted ${externalCandidates.length} candidates`,
        count: externalCandidates.length,
      };
    } catch (err: any) {
      throw new ServiceUnavailableException(
        err?.message || 'External ATS sync failed. Please retry.',
      );
    } finally {
      await this.prisma.$queryRaw`SELECT pg_advisory_unlock(${lockKey})`;
    }
  }

  async getRecruiterDashboard(query: DashboardQuery = {}) {
    const limit = this.clampInt(query.limit, 25, 1, 100);
    const offset = this.clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER);

    const [candidates, total] = await this.prisma.$transaction([
      this.prisma.candidate.findMany({
        take: limit,
        skip: offset,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          externalId: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.candidate.count(),
    ]);

    const candidateIds = candidates.map((c) => c.id);
    const aggregates =
      candidateIds.length === 0
        ? []
        : await this.prisma.interviewNote.groupBy({
            by: ['candidateId'],
            where: { candidateId: { in: candidateIds } },
            _avg: {
              technicalScore: true,
              communicationScore: true,
              problemSolvingScore: true,
              culturalFitScore: true,
            },
            _count: { _all: true },
          });

    const aggByCandidateId = new Map(aggregates.map((a) => [a.candidateId, a]));

    const candidatesWithStats = candidates.map((c) => {
      const a = aggByCandidateId.get(c.id);
      const noteCount = a?._count?._all ?? 0;
      const avg =
        noteCount > 0
          ? ((a!._avg.technicalScore ?? 0) +
              (a!._avg.communicationScore ?? 0) +
              (a!._avg.problemSolvingScore ?? 0) +
              (a!._avg.culturalFitScore ?? 0)) /
            4
          : null;

      return {
        ...c,
        interviewNotesCount: noteCount,
        averageScore: avg !== null ? Math.round(avg * 100) / 100 : null,
      };
    });

    return {
      candidates: candidatesWithStats,
      total,
      limit,
      offset,
    };
  }

  private clampInt(value: unknown, fallback: number, min: number, max: number) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    opts: { attempts: number; baseDelayMs: number },
  ): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= opts.attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt === opts.attempts) break;
        const jitter = Math.floor(Math.random() * 100);
        const backoff = opts.baseDelayMs * 2 ** (attempt - 1) + jitter;
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    throw lastErr;
  }
}
