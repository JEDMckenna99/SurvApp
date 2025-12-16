import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  TextField,
} from '@mui/material'
import {
  Phone as PhoneIcon,
  Timeline as TimelineIcon,
  Sms as SmsIcon,
  Photo as PhotoIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

export default function JobDetailsPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState<any>(null)
  const [smsMessages, setSmsMessages] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [customerPhone, setCustomerPhone] = useState('')

  useEffect(() => {
    if (jobId) {
      loadJobDetails()
      loadSMSMessages()
      loadTimeline()
    }
  }, [jobId])

  const loadJobDetails = async () => {
    try {
      const response = await apiClient.get(`/api/v1/jobs/${jobId}`)
      setJob(response.data)
      
      // Load customer to get phone
      const customerResponse = await apiClient.get(`/api/v1/customers/${response.data.customer_id}`)
      setCustomerPhone(customerResponse.data.phone || '')
    } catch (error) {
      toast.error('Failed to load job details')
    }
  }

  const loadSMSMessages = async () => {
    try {
      const response = await apiClient.get(`/api/v1/sms/messages/${jobId}`)
      setSmsMessages(response.data)
    } catch (error) {
      console.error('Failed to load SMS messages')
    }
  }

  const loadTimeline = async () => {
    try {
      const response = await apiClient.get(`/api/v1/sms/timeline/${jobId}`)
      setTimeline(response.data)
    } catch (error) {
      console.error('Failed to load timeline')
    }
  }

  const updateCustomerPhone = async () => {
    if (!job) return
    
    try {
      await apiClient.put(`/api/v1/customers/${job.customer_id}`, {
        phone: customerPhone
      })
      toast.success('Customer phone updated')
    } catch (error) {
      toast.error('Failed to update phone number')
    }
  }

  if (!job) {
    return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Job #{job.job_number} - {job.title}
      </Typography>

      <Grid container spacing={3}>
        {/* Job Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Information
            </Typography>
            <Typography variant="body2"><strong>Status:</strong> <Chip label={job.status} size="small" /></Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Type:</strong> {job.job_type}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Priority:</strong> {job.priority}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Scheduled:</strong> {new Date(job.scheduled_date).toLocaleDateString()}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Description:</strong></Typography>
            <Typography variant="body2" color="text.secondary">{job.description}</Typography>
          </Paper>
        </Grid>

        {/* Customer Phone Management */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Customer Contact
            </Typography>
            <TextField
              fullWidth
              label="Customer Phone (for SMS)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="555-1234"
              helperText="Enter phone number to enable SMS notifications"
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={updateCustomerPhone} fullWidth>
              Save Phone Number
            </Button>
          </Paper>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Job Timeline
            </Typography>
            {timeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No activity yet</Typography>
            ) : (
              <List>
                {timeline.map((event, index) => (
                  <Box key={event.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box>
                            <Chip label={event.event_type.replace('_', ' ')} size="small" sx={{ mr: 1 }} />
                            <Typography variant="caption">
                              {new Date(event.event_time).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2">{event.employee_name}</Typography>
                            {event.travel_time_minutes && (
                              <Typography variant="caption" color="info.main">
                                Travel time: {event.travel_time_minutes} minutes
                              </Typography>
                            )}
                            {event.job_duration_minutes && (
                              <Typography variant="caption" color="success.main">
                                Job duration: {event.job_duration_minutes} minutes
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < timeline.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* SMS Messages */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <SmsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              SMS Activity
            </Typography>
            {smsMessages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No messages yet</Typography>
            ) : (
              <List>
                {smsMessages.map((msg, index) => (
                  <Box key={msg.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={msg.direction}
                              size="small"
                              color={msg.direction === 'inbound' ? 'primary' : 'secondary'}
                            />
                            {msg.command_type && (
                              <Chip label={msg.command_type} size="small" variant="outlined" />
                            )}
                            {msg.has_media && <PhotoIcon fontSize="small" color="primary" />}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2">{msg.body}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(msg.received_at || msg.sent_at).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < smsMessages.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}










