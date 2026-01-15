import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import { useGetCandidatesQuery, useSyncFromAtsMutation } from '../store/api/candidatesApi';
import { useState } from 'react';

function Dashboard() {
  const [syncError, setSyncError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data, error, refetch, isFetching } = useGetCandidatesQuery({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });
  const [syncFromAts] = useSyncFromAtsMutation();

  const handleSync = async () => {
    try {
      setSyncError(null);
      await syncFromAts().unwrap();
      refetch();
    } catch (err: any) {
      setSyncError(err?.data?.message || err?.message || 'Failed to sync from ATS');
    }
  };

  return (
    <Box className="h-screen">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Recruiter Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          onClick={handleSync}
          disabled={isFetching}
        >
          Sync from ATS
        </Button>
      </Box>

      {syncError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSyncError(null)}>
          {syncError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load candidates
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>External ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Average Score</TableCell>
              <TableCell>Interview Notes</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No candidates found
                </TableCell>
              </TableRow>
            ) : (
              data?.candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>{candidate.externalId}</TableCell>
                  <TableCell>
                    {candidate.firstName} {candidate.lastName}
                  </TableCell>
                  <TableCell>{candidate.email}</TableCell>
                  <TableCell>
                    {candidate.averageScore !== null && candidate.averageScore !== undefined
                      ? candidate.averageScore.toFixed(2)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {candidate.interviewNotesCount ?? 0}
                  </TableCell>
                  <TableCell>
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {data && (
        <TablePagination
          component="div"
          count={data.total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}

      {data && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Showing {data.candidates.length} of {data.total} candidates
        </Typography>
      )}
    </Box>
  );
}

export default Dashboard;
