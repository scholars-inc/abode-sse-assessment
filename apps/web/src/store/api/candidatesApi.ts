import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface InterviewNote {
  id: string;
  interviewer: string;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  culturalFitScore: number;
  notes: string | null;
}

export interface Application {
  id: string;
  candidateId: string;
  status: string;
  jobTitle: string;
  createdAt: string;
  updatedAt: string;
  interviewNotes: InterviewNote[];
}

export interface Candidate {
  id: string;
  email: string;
  externalId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  interviewNotesCount: number;
  averageScore: number | null;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  total: number;
  limit: number;
  offset: number;
}

export interface SyncResponse {
  message: string;
  count: number;
}

export const candidatesApi = createApi({
  reducerPath: 'candidatesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000',
  }),
  tagTypes: ['Candidates'],
  endpoints: (builder) => ({
    getCandidates: builder.query<CandidatesResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 25, offset = 0 } = {}) => ({
        url: '/candidates',
        params: { limit, offset },
      }),
      providesTags: ['Candidates'],
    }),
    syncFromAts: builder.mutation<SyncResponse, void>({
      query: () => ({
        url: '/candidates/sync',
        method: 'POST',
      }),
      invalidatesTags: ['Candidates'],
    }),
  }),
});

export const { useGetCandidatesQuery, useSyncFromAtsMutation } = candidatesApi;
