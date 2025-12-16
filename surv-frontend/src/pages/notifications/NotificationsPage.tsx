import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Sms as SmsIcon, Send as SendIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

export default function NotificationsPage() {
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [smsData, setSmsData] = useState({
    to: '',
    message: '',
  })

  const handleSendSMS = async () => {
    try {
      await apiClient.post('/api/v1/notifications/sms/send', smsData)
      toast.success('SMS sent successfully')
      setSmsDialogOpen(false)
      setSmsData({ to: '', message: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send SMS')
    }
  }

  const sendQuickNotification = async (type: string) => {
    const messages: any = {
      reminder: 'This is a reminder about your upcoming service appointment.',
      confirmation: 'Your service appointment has been confirmed!',
      complete: 'Your service has been completed. Thank you for choosing Surv!',
    }

    try {
      await apiClient.post('/api/v1/notifications/sms/send', {
        to: '555-0000', // Placeholder - in real app, would select customer
        message: messages[type],
      })
      toast.success('Notification sent')
    } catch (error) {
      toast.error('Failed to send notification')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          SMS Notifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<SmsIcon />}
          onClick={() => setSmsDialogOpen(true)}
        >
          Send SMS
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Reminders
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send automated reminders for upcoming appointments
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => sendQuickNotification('reminder')}
                fullWidth
              >
                Send Reminder
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Confirmations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Confirm appointments with customers
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => sendQuickNotification('confirmation')}
                fullWidth
              >
                Send Confirmation
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Complete
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Notify customers when service is done
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => sendQuickNotification('complete')}
                fullWidth
              >
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              SMS Features
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Automated SMS notifications include:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">• Appointment confirmations</Typography>
              <Typography variant="body2">• Technician en-route notifications</Typography>
              <Typography variant="body2">• Service completion updates</Typography>
              <Typography variant="body2">• Payment reminders</Typography>
              <Typography variant="body2">• Custom messages</Typography>
            </Box>
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="caption" color="info.dark">
                <strong>Note:</strong> To enable SMS sending, configure Twilio credentials in Heroku environment variables:
                TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send SMS</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={smsData.to}
              onChange={(e) => setSmsData({ ...smsData, to: e.target.value })}
              placeholder="555-1234"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message"
              value={smsData.message}
              onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
              placeholder="Enter your message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendSMS} variant="contained">
            Send SMS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}











