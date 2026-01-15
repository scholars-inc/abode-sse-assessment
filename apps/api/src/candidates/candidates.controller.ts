import { Controller, Get, Post, Query } from '@nestjs/common';
import { CandidatesService } from './candidates.service';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  async getRecruiterDashboard(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.candidatesService.getRecruiterDashboard({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post('sync')
  async syncFromAts() {
    return this.candidatesService.syncFromAts();
  }
}
