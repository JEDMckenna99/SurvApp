import { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Badge,
} from '@mui/material'
import {
  Sms as SmsIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import { apiClient } from '../../api/client'

interface SMSActivityIndicatorProps {
  jobId: string
}

export default function SMSActivityIndicator({ jobId }: SMSActivityIndicatorProps) {
  const [messageCount, setMessageCount] = useState(0)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  useEffect(() => {
    loadActivity()
  }, [jobId])

  const loadActivity = async () => {
    try {
      const [messagesResponse, timelineResponse] = await Promise.all([
        apiClient.get(`/api/v1/sms/messages/${jobId}`),
        apiClient.get(`/api/v1/sms/timeline/${jobId}`)
      ])
      
      setMessageCount(messagesResponse.data.length)
      
      if (timelineResponse.data.length > 0) {
        const latest = timelineResponse.data[timelineResponse.data.length - 1]
        setLastActivity(latest.event_type)
      }
    } catch (error) {
      // Silently fail - not critical
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {messageCount > 0 && (
        <Tooltip title={`${messageCount} SMS messages`}>
          <Badge badgeContent={messageCount} color="primary">
            <SmsIcon fontSize="small" color="action" />
          </Badge>
        </Tooltip>
      )}
      {lastActivity && (
        <Tooltip title={`Last: ${lastActivity.replace('_', ' ')}`}>
          <Chip
            icon={<TimelineIcon />}
            label={lastActivity.replace('_', ' ')}
            size="small"
            variant="outlined"
          />
        </Tooltip>
      )}
    </Box>
  )
}

