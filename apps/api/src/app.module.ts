import { Module } from '@nestjs/common';
import { CandidatesModule } from './candidates/candidates.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, CandidatesModule],
})
export class AppModule {}
