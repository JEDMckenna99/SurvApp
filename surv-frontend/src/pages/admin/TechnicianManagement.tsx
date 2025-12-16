import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import {
  Edit as EditIcon,
  Sms as SmsIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface Technician {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active: boolean
  role: string
}

export default function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsMessage, setSmsMessage] = useState('')

  useEffect(() => {
    loadTechnicians()
  }, [])

  const loadTechnicians = async () => {
    try {
      // Get all users with technician role
      const response = await apiClient.get('/api/v1/users')
      const techs = response.data.filter((user: any) => user.role === 'technician')
      setTechnicians(techs)
    } catch (error) {
      // Fallback - create a users endpoint if it doesn't exist
      toast.error('Failed to load technicians')
    }
  }

  const handleEditPhone = (tech: Technician) => {
    setSelectedTech(tech)
    setPhoneNumber(tech.phone || '')
    setEditDialogOpen(true)
  }

  const savePhoneNumber = async () => {
    if (!selectedTech) return

    try {
      await apiClient.put(`/api/v1/users/${selectedTech.id}`, {
        phone: phoneNumber
      })
      toast.success('Phone number updated')
      setEditDialogOpen(false)
      loadTechnicians()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update phone number')
    }
  }

  const initializeSMSThread = async (tech: Technician) => {
    if (!tech.phone) {
      toast.error('Please add phone number first')
      return
    }

    try {
      const welcomeMessage = `Welcome to Surv, ${tech.first_name}!

You can now manage your jobs via text:
• "clock in" - Start your day
• "omw #123" - Notify customer you're on the way
• "start #123" - Start job timer
• "done #123" - Complete job
• "jobs" - List your jobs
• "help" - Show all commands

Reply "help" anytime for the full command list.`

      await apiClient.post('/api/v1/notifications/sms/send', {
        to: tech.phone,
        message: welcomeMessage
      })

      toast.success(`Welcome SMS sent to ${tech.first_name}`)
    } catch (error) {
      toast.error('Failed to send SMS')
    }
  }

  const openSendSMS = (tech: Technician) => {
    setSelectedTech(tech)
    setSmsMessage('')
    setSmsDialogOpen(true)
  }

  const sendCustomSMS = async () => {
    if (!selectedTech || !smsMessage) return

    try {
      await apiClient.post('/api/v1/notifications/sms/send', {
        to: selectedTech.phone,
        message: smsMessage
      })
      toast.success(`SMS sent to ${selectedTech.first_name}`)
      setSmsDialogOpen(false)
      setSmsMessage('')
    } catch (error) {
      toast.error('Failed to send SMS')
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Technician Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Technicians</Typography>
              <Typography variant="h3" color="primary">{technicians.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">SMS Enabled</Typography>
              <Typography variant="h3" color="success.main">
                {technicians.filter(t => t.phone).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Active</Typography>
              <Typography variant="h3" color="info.main">
                {technicians.filter(t => t.is_active).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>SMS Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technicians.map((tech) => (
              <TableRow key={tech.id}>
                <TableCell>{tech.first_name} {tech.last_name}</TableCell>
                <TableCell>{tech.email}</TableCell>
                <TableCell>
                  {tech.phone || (
                    <Typography variant="body2" color="text.secondary">Not set</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {tech.phone ? (
                    <Chip label="Enabled" color="success" size="small" />
                  ) : (
                    <Chip label="No Phone" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEditPhone(tech)}
                    title="Edit Phone"
                  >
                    <PhoneIcon />
                  </IconButton>
                  {tech.phone && (
                    <>
                      <Button
                        size="small"
                        onClick={() => initializeSMSThread(tech)}
                        title="Send Welcome SMS"
                      >
                        Init SMS
                      </Button>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => openSendSMS(tech)}
                        title="Send Message"
                      >
                        <SmsIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Phone Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Phone Number</DialogTitle>
        <DialogContent>
          {selectedTech && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Technician: <strong>{selectedTech.first_name} {selectedTech.last_name}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+15551234567"
                helperText="Include country code (e.g., +1 for US)"
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={savePhoneNumber} variant="contained">
            Save Phone Number
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send SMS Dialog */}
      <Dialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send SMS to {selectedTech?.first_name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              To: {selectedTech?.phone}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Enter your message..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialogOpen(false)}>Cancel</Button>
          <Button onClick={sendCustomSMS} variant="contained" startIcon={<SendIcon />}>
            Send SMS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}










