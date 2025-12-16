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
import { Email as EmailIcon, Send as SendIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

export default function CampaignsPage() {
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
  })

  const handleSendCampaign = async () => {
    try {
      const response = await apiClient.post('/api/v1/campaigns/email/create', {
        ...formData,
        target_customers: [], // Empty = all customers
      })
      toast.success(response.data.message)
      setCampaignDialogOpen(false)
      setFormData({ name: '', subject: '', body: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create campaign')
    }
  }

  const sendTemplate = async (templateName: string) => {
    try {
      // Use pre-made template
      const templates: any = {
        job_reminder: {
          name: 'Job Reminder Campaign',
          subject: 'Upcoming Service Appointment',
          body: 'Dear Customer,\n\nThis is a reminder about your upcoming service appointment.\n\nThank you,\nSurv Team',
        },
        review_request: {
          name: 'Review Request',
          subject: 'How did we do?',
          body: 'Dear Customer,\n\nWe would love to hear about your experience!\n\nBest regards,\nSurv Team',
        },
      }

      const response = await apiClient.post('/api/v1/campaigns/email/create', {
        ...templates[templateName],
        target_customers: [],
      })
      toast.success(response.data.message)
    } catch (error: any) {
      toast.error('Failed to send campaign')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Email Marketing
        </Typography>
        <Button
          variant="contained"
          startIcon={<EmailIcon />}
          onClick={() => setCampaignDialogOpen(true)}
        >
          Create Campaign
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Reminder Campaign
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send automated reminders to customers with upcoming appointments
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => sendTemplate('job_reminder')}
                fullWidth
              >
                Send to All Customers
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Request Campaign
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Request reviews from customers after completed jobs
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => sendTemplate('review_request')}
                fullWidth
              >
                Send Review Requests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Email Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pre-built templates available:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">• Job Confirmation</Typography>
              <Typography variant="body2">• Invoice Reminder</Typography>
              <Typography variant="body2">• Service Complete</Typography>
              <Typography variant="body2">• Review Request</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={campaignDialogOpen} onClose={() => setCampaignDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Email Campaign</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Campaign Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Email Body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Enter your email message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCampaignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendCampaign} variant="contained">
            Send to All Customers
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}











