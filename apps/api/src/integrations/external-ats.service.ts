import { Injectable } from '@nestjs/common';

export interface ExternalCandidate {
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class ExternalAtsService {
  /**
   * Mock GET /candidates endpoint
   * Returns 100 "new" candidates
   * Has 1.5s latency and 20% chance of throwing a 500 error mid-stream
   */
  async getCandidates(): Promise<ExternalCandidate[]> {
    // Simulate network latency
    await this.delay(1500);

    // 20% chance of throwing an error mid-stream
    if (Math.random() < 0.2) {
      throw new Error('External ATS service returned 500 Internal Server Error');
    }

    // Generate 100 mock candidates
    const candidates: ExternalCandidate[] = [];
    for (let i = 1; i <= 100; i++) {
      candidates.push({
        externalId: `ATS-${String(i).padStart(6, '0')}`,
        email: `candidate${i}@example.com`,
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
      });
    }

    return candidates;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
