import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { ExternalAtsService } from '../integrations/external-ats.service';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, ExternalAtsService],
})
export class CandidatesModule {}
