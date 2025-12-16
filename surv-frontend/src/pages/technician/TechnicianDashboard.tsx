import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Divider,
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  DirectionsCar as OnWayIcon,
  CheckCircle as CompleteIcon,
  Description as DetailsIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'
import { RootState } from '../../store/store'

interface Job {
  id: string
  job_number: string
  title: string
  description: string
  customer_id: string
  job_type: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  status: string
  priority: string
  address: string
}

interface Customer {
  first_name: string
  last_name: string
  phone: string
  address_line1: string
  city: string
  state: string
}

export default function TechnicianDashboard() {
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    loadMyJobs()
    checkClockStatus()
  }, [])

  const loadMyJobs = async () => {
    try {
      setLoading(true)
      // Get jobs assigned to current technician for today and upcoming
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const response = await apiClient.get(`/api/v1/jobs?date_from=${today}&date_to=${nextWeek}&assigned_to=${user?.id}`)
      
      // Get customer details for each job
      const jobsWithCustomers = await Promise.all(
        response.data.map(async (job: any) => {
          try {
            const customerResponse = await apiClient.get(`/api/v1/customers/${job.customer_id}`)
            const customer = customerResponse.data
            return {
              ...job,
              address: `${customer.address_line1}, ${customer.city}, ${customer.state}`,
              customerName: `${customer.first_name} ${customer.last_name}`,
              customerPhone: customer.phone,
            }
          } catch (error) {
            return {
              ...job,
              address: 'Address not available',
              customerName: 'Unknown',
              customerPhone: '',
            }
          }
        })
      )
      
      setMyJobs(jobsWithCustomers)
    } catch (error) {
      toast.error('Failed to load your jobs')
    } finally {
      setLoading(false)
    }
  }

  const checkClockStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await apiClient.get(`/api/v1/time-tracking?date_from=${today}&date_to=${today}`)
      const entries = response.data
      
      // Check if there's an active clock-in (entry_type = clock_in without matching clock_out)
      const clockedIn = entries.some((entry: any) => entry.entry_type === 'clock_in')
      setIsClockedIn(clockedIn)
    } catch (error) {
      console.error('Failed to check clock status')
    }
  }

  const handleClockIn = async () => {
    try {
      await apiClient.post('/api/v1/time-tracking', {
        entry_type: 'clock_in',
        entry_time: new Date().toISOString(),
      })
      setIsClockedIn(true)
      toast.success('Clocked in successfully!')
    } catch (error) {
      toast.error('Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      await apiClient.post('/api/v1/time-tracking', {
        entry_type: 'clock_out',
        entry_time: new Date().toISOString(),
      })
      setIsClockedIn(false)
      toast.success('Clocked out successfully!')
    } catch (error) {
      toast.error('Failed to clock out')
    }
  }

  const startJob = async (job: Job) => {
    try {
      await apiClient.post('/api/v1/time-tracking', {
        entry_type: 'job_start',
        entry_time: new Date().toISOString(),
        job_id: job.id,
      })
      
      // Update job status to in_progress
      await apiClient.put(`/api/v1/jobs/${job.id}`, {
        ...job,
        status: 'in_progress',
      })
      
      setCurrentJob(job)
      toast.success(`Started work on: ${job.title}`)
      loadMyJobs()
    } catch (error) {
      toast.error('Failed to start job')
    }
  }

  const completeJob = async (job: Job) => {
    try {
      await apiClient.post('/api/v1/time-tracking', {
        entry_type: 'job_end',
        entry_time: new Date().toISOString(),
        job_id: job.id,
      })
      
      // Update job status to completed
      await apiClient.put(`/api/v1/jobs/${job.id}`, {
        ...job,
        status: 'completed',
      })
      
      setCurrentJob(null)
      toast.success(`Completed: ${job.title}`)
      loadMyJobs()
    } catch (error) {
      toast.error('Failed to complete job')
    }
  }

  const notifyCustomerOnWay = async (job: any) => {
    try {
      await apiClient.post(`/api/v1/notifications/job-reminder/${job.id}`)
      toast.success(`Customer notified: ${job.customerName}`)
    } catch (error) {
      toast.error('Failed to send notification')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info'
      case 'in_progress': return 'warning'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      default: return 'default'
    }
  }

  const todayJobs = myJobs.filter(job => job.scheduled_date === new Date().toISOString().split('T')[0])
  const upcomingJobs = myJobs.filter(job => job.scheduled_date > new Date().toISOString().split('T')[0])

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Clock In/Out */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isClockedIn ? 'success.light' : 'grey.100' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="bold">
              Welcome, {user?.first_name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isClockedIn ? 'You are clocked in' : 'Clock in to start your day'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            {isClockedIn ? (
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<StopIcon />}
                onClick={handleClockOut}
              >
                Clock Out
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<StartIcon />}
                onClick={handleClockIn}
              >
                Clock In
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Today's Jobs */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Today's Schedule ({todayJobs.length} jobs)
      </Typography>

      {loading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading your jobs...</Typography>
        </Paper>
      ) : todayJobs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No jobs scheduled for today</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {todayJobs.map((job: any) => (
            <Grid item xs={12} key={job.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Job #{job.job_number}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                      <Chip label={job.priority} color={getPriorityColor(job.priority)} size="small" />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer:</Typography>
                      <Typography variant="body1" fontWeight="bold">{job.customerName}</Typography>
                      <Typography variant="body2">{job.customerPhone}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Address:</Typography>
                      <Typography variant="body2">{job.address}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Time:</Typography>
                      <Typography variant="body1">
                        {job.scheduled_start_time} - {job.scheduled_end_time}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Service:</Typography>
                      <Typography variant="body1">{job.job_type}</Typography>
                    </Grid>
                    {job.description && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Description:</Typography>
                        <Typography variant="body2">{job.description}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {job.status === 'scheduled' && (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<OnWayIcon />}
                          onClick={() => notifyCustomerOnWay(job)}
                        >
                          I'm On My Way
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<StartIcon />}
                          onClick={() => startJob(job)}
                        >
                          Start Job
                        </Button>
                      </>
                    )}
                    {job.status === 'in_progress' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CompleteIcon />}
                        onClick={() => completeJob(job)}
                      >
                        Complete Job
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, mt: 4 }}>
            Upcoming Jobs ({upcomingJobs.length})
          </Typography>
          <Grid container spacing={2}>
            {upcomingJobs.map((job: any) => (
              <Grid item xs={12} sm={6} md={4} key={job.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(job.scheduled_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      {job.scheduled_start_time} - {job.scheduled_end_time}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>{job.customerName}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.address}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label={job.job_type} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  )
}











