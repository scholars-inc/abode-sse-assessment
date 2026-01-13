import { Controller, Get, Post, Query } from '@nestjs/common';
import { CandidatesService } from './candidates.service';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  async getRecruiterDashboard() {
    return this.candidatesService.getRecruiterDashboard();
  }

  @Post('sync')
  async syncFromAts() {
    return this.candidatesService.syncFromAts();
  }
}
