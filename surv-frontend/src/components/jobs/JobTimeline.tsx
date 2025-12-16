import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  Chip,
} from '@mui/lab'
import {
  DirectionsCar,
  PlayArrow,
  CheckCircle,
  Message,
} from '@mui/icons-material'
import { apiClient } from '../../api/client'

interface JobTimelineProps {
  jobId: string
}

export default function JobTimeline({ jobId }: JobTimelineProps) {
  const [timeline, setTimeline] = useState<any[]>([])

  useEffect(() => {
    loadTimeline()
  }, [jobId])

  const loadTimeline = async () => {
    try {
      const response = await apiClient.get(`/api/v1/sms/timeline/${jobId}`)
      setTimeline(response.data)
    } catch (error) {
      console.error('Failed to load timeline')
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'on_my_way':
        return <DirectionsCar />
      case 'started':
        return <PlayArrow />
      case 'completed':
        return <CheckCircle />
      default:
        return <Message />
    }
  }

  const getEventColor = (eventType: string): any => {
    switch (eventType) {
      case 'on_my_way':
        return 'info'
      case 'started':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'grey'
    }
  }

  return (
    <Box>
      {timeline.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No activity yet
        </Typography>
      ) : (
        <Timeline>
          {timeline.map((event) => (
            <TimelineItem key={event.id}>
              <TimelineOppositeContent color="text.secondary">
                {new Date(event.event_time).toLocaleTimeString()}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getEventColor(event.event_type)}>
                  {getEventIcon(event.event_type)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {event.event_type.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.employee_name}
                  </Typography>
                  {event.travel_time_minutes && (
                    <Chip
                      label={`Travel: ${event.travel_time_minutes} min`}
                      size="small"
                      color="info"
                      sx={{ mt: 1 }}
                    />
                  )}
                  {event.job_duration_minutes && (
                    <Chip
                      label={`Duration: ${event.job_duration_minutes} min`}
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </Box>
  )
}










