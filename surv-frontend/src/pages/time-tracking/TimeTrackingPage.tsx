import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  AccessTime as ClockIcon,
  PlayArrow as ClockInIcon,
  Stop as ClockOutIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface TimeEntry {
  id: string
  entry_type: string
  entry_time: string
  job_id?: string
  notes?: string
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeEntries()
  }, [])

  const loadTimeEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await apiClient.get('/api/v1/time-tracking', {
        params: { date_from: today, date_to: today }
      })
      setTimeEntries(response.data)
      
      // Check if currently clocked in
      const lastEntry = response.data[0]
      if (lastEntry && lastEntry.entry_type === 'clock_in') {
        setIsClockedIn(true)
      }
    } catch (error) {
      toast.error('Failed to load time entries')
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    try {
      await apiClient.post('/api/v1/time-tracking', {
        entry_type: 'clock_in',
        entry_time: new Date().toISOString(),
        notes: 'Clocked in from web'
      })
      toast.success('Clocked in successfully!')
      setIsClockedIn(true)
      loadTimeEntries()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      await apiClient.post('/api/v1/time-tracking', {
        entry_type: 'clock_out',
        entry_time: new Date().toISOString(),
        notes: 'Clocked out from web'
      })
      toast.success('Clocked out successfully!')
      setIsClockedIn(false)
      loadTimeEntries()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to clock out')
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Time Tracking
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ClockIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Current Status</Typography>
                  <Typography variant="h4" color={isClockedIn ? 'success.main' : 'text.secondary'}>
                    {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<ClockInIcon />}
                  onClick={handleClockIn}
                  disabled={isClockedIn}
                >
                  Clock In
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<ClockOutIcon />}
                  onClick={handleClockOut}
                  disabled={!isClockedIn}
                >
                  Clock Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Time Entries: {timeEntries.length}
              </Typography>
              <Typography variant="h5" sx={{ mt: 2 }}>
                Hours Today: 0.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Today's Time Entries
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                  <TableCell><strong>Notes</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No time entries today
                    </TableCell>
                  </TableRow>
                ) : (
                  timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.entry_time).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.entry_type.replace('_', ' ').toUpperCase()}
                          color={entry.entry_type.includes('in') ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{entry.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  )
}

