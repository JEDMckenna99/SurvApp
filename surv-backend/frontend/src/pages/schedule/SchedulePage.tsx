import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  CalendarToday as CalendarIcon,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface Job {
  id: string
  job_number: string
  title: string
  customer_id: string
  status: string
  priority: string
  scheduled_date: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  assigned_to?: string
}

export default function SchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [currentDate])

  const loadJobs = async () => {
    try {
      // Get jobs for current week
      const dateFrom = new Date(currentDate)
      dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay()) // Start of week
      
      const dateTo = new Date(dateFrom)
      dateTo.setDate(dateTo.getDate() + 7) // End of week
      
      const response = await apiClient.get('/api/v1/jobs', {
        params: {
          date_from: dateFrom.toISOString().split('T')[0],
          date_to: dateTo.toISOString().split('T')[0]
        }
      })
      setJobs(response.data)
    } catch (error) {
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') newDate.setDate(newDate.getDate() - 1)
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7)
    else newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') newDate.setDate(newDate.getDate() + 1)
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7)
    else newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      return date
    })
  }

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return jobs.filter(job => job.scheduled_date === dateStr)
  }

  const weekDays = getWeekDays()

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Schedule Calendar
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button onClick={handlePrevious} startIcon={<NavigateBefore />}>
            Previous
          </Button>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
          <Button onClick={handleNext} endIcon={<NavigateNext />}>
            Next
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Week of {weekDays[0].toLocaleDateString()}
        </Typography>
        
        <Grid container spacing={2}>
          {weekDays.map((day, index) => {
            const dayJobs = getJobsForDate(day)
            const isToday = day.toDateString() === new Date().toDateString()
            
            return (
              <Grid item xs={12} sm={6} md={1.71} key={index}>
                <Card 
                  variant={isToday ? "elevation" : "outlined"}
                  sx={{ 
                    bgcolor: isToday ? 'primary.light' : 'background.paper',
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="subtitle2" 
                      textAlign="center"
                      fontWeight="bold"
                      color={isToday ? 'primary.contrastText' : 'text.primary'}
                    >
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      textAlign="center"
                      color={isToday ? 'primary.contrastText' : 'text.primary'}
                    >
                      {day.getDate()}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      {dayJobs.length === 0 ? (
                        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                          No jobs
                        </Typography>
                      ) : (
                        dayJobs.map((job) => (
                          <Box
                            key={job.id}
                            sx={{
                              p: 1,
                              mb: 1,
                              bgcolor: 'background.default',
                              borderRadius: 1,
                              borderLeft: 3,
                              borderColor: job.priority === 'urgent' ? 'error.main' : job.priority === 'high' ? 'warning.main' : 'primary.main'
                            }}
                          >
                            <Typography variant="caption" display="block" fontWeight="bold">
                              {job.title}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {job.scheduled_start_time || '9:00 AM'}
                            </Typography>
                            <Chip 
                              label={job.status} 
                              size="small" 
                              sx={{ mt: 0.5, height: 18, fontSize: '0.7rem' }}
                            />
                          </Box>
                        ))
                      )}
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      textAlign="center" 
                      display="block"
                      sx={{ mt: 1 }}
                      fontWeight="bold"
                    >
                      {dayJobs.length} {dayJobs.length === 1 ? 'job' : 'jobs'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Paper>
    </Box>
  )
}

