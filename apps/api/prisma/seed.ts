import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma v7 requires an adapter for PostgreSQL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with 1000+ legacy records...');

  const jobTitles = [
    'Software Engineer',
    'Senior Software Engineer',
    'Product Manager',
    'Product Designer',
    'Data Engineer',
    'DevOps Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Full Stack Engineer',
    'Engineering Manager',
  ];

  const statuses = ['APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'];

  // Create 1000+ candidates
  const candidates = [];
  for (let i = 1; i <= 5000; i++) {
    candidates.push({
      externalId: `LEGACY-${String(i).padStart(6, '0')}`,
      email: `legacy${i}@example.com`,
      firstName: `Legacy${i}`,
      lastName: `Candidate${i}`,
    });
  }

  // Create candidates in batches
  for (let i = 0; i < candidates.length; i += 100) {
    const batch = candidates.slice(i, i + 100);
    await prisma.candidate.createMany({
      data: batch,
    });
    console.log(`Created ${Math.min(i + 100, candidates.length)} candidates...`);
  }

  // Fetch all candidates to create applications
  const allCandidates = await prisma.candidate.findMany();
  console.log('Creating applications...');

  // Create applications for candidates (1-2 per candidate)
  const applications = [];
  for (const candidate of allCandidates) {
    // Randomly decide how many applications (1 or 2)
    const applicationCount = Math.random() < 0.7 ? 1 : 2; // 70% have 1, 30% have 2

    for (let j = 0; j < applicationCount; j++) {
      const randomJobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      applications.push({
        candidateId: candidate.id,
        status: randomStatus,
        jobTitle: randomJobTitle,
      });
    }
  }

  // Create applications in batches
  for (let i = 0; i < applications.length; i += 100) {
    const batch = applications.slice(i, i + 100);
    await prisma.application.createMany({
      data: batch,
    });
    console.log(`Created ${Math.min(i + 100, applications.length)} applications...`);
  }

  // Fetch all applications with their candidates to create interview notes
  const allApplications = await prisma.application.findMany({
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log('Creating interview notes...');

  // Group applications by candidate to find the most recent one
  const candidateApplicationsMap = new Map<string, typeof allApplications>();
  for (const application of allApplications) {
    if (!candidateApplicationsMap.has(application.candidateId)) {
      candidateApplicationsMap.set(application.candidateId, []);
    }
    candidateApplicationsMap.get(application.candidateId)!.push(application);
  }

  // Create interview notes for some applications (not all)
  // Only create notes for applications in INTERVIEWING or OFFER status
  const interviewNotes = [];

  for (const [candidateId, apps] of candidateApplicationsMap.entries()) {
    // Only create notes for ~40% of candidates (simulating real-world messy data)
    if (Math.random() > 0.4) {
      continue;
    }

    // Get the most recent application for this candidate
    const mostRecentApp = apps[apps.length - 1];

    // Only create notes for applications in INTERVIEWING or OFFER status
    if (!['INTERVIEWING', 'OFFER'].includes(mostRecentApp.status)) {
      continue;
    }

    // Add 2-5 interview notes per application
    const noteCount = Math.floor(Math.random() * 4) + 2;

    for (let j = 0; j < noteCount; j++) {
      interviewNotes.push({
        candidateId: candidateId,
        applicationId: mostRecentApp.id,
        interviewer: `Interviewer${j + 1}`,
        technicalScore: Math.floor(Math.random() * 5) + 1, // 1-5
        communicationScore: Math.floor(Math.random() * 5) + 1,
        problemSolvingScore: Math.floor(Math.random() * 5) + 1,
        culturalFitScore: Math.floor(Math.random() * 5) + 1,
        notes: `Interview notes for ${mostRecentApp.candidate.firstName} ${mostRecentApp.candidate.lastName} - ${(mostRecentApp as any).jobTitle}`,
      });
    }
  }

  // Create interview notes in batches
  for (let i = 0; i < interviewNotes.length; i += 100) {
    const batch = interviewNotes.slice(i, i + 100);
    await prisma.interviewNote.createMany({
      data: batch,
    });
    console.log(`Created ${Math.min(i + 100, interviewNotes.length)} interview notes...`);
  }

  console.log(`Seed completed!`);
  console.log(`- ${allCandidates.length} candidates`);
  console.log(`- ${applications.length} applications`);
  console.log(`- ${interviewNotes.length} interview notes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
