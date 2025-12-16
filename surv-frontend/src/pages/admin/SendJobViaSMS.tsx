import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material'
import { Send as SendIcon, Edit as EditIcon, Sms as SmsIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

export default function SendJobViaSMS() {
  const [jobs, setJobs] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')

  useEffect(() => {
    loadJobs()
    loadTechnicians()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await apiClient.get('/api/v1/jobs?status_filter=scheduled')
      setJobs(response.data)
    } catch (error) {
      toast.error('Failed to load jobs')
    }
  }

  const loadTechnicians = async () => {
    try {
      const response = await apiClient.get('/api/v1/users')
      const techs = response.data.filter((user: any) => 
        user.role === 'technician' && user.phone
      )
      setTechnicians(techs)
    } catch (error) {
      console.error('Failed to load technicians')
    }
  }

  const editJobDescription = (job: any) => {
    setSelectedJob(job)
    setJobDescription(job.description || '')
    setEditDialogOpen(true)
  }

  const saveJobDescription = async () => {
    if (!selectedJob) return

    try {
      await apiClient.put(`/api/v1/jobs/${selectedJob.id}`, {
        ...selectedJob,
        description: jobDescription
      })
      toast.success('Job description updated')
      setEditDialogOpen(false)
      loadJobs()
    } catch (error) {
      toast.error('Failed to update job')
    }
  }

  const sendJobViaSMS = async (job: any, techId: string) => {
    const tech = technicians.find(t => t.id === techId)
    if (!tech || !tech.phone) {
      toast.error('Technician phone number not found')
      return
    }

    try {
      // Load customer info
      const customerResponse = await apiClient.get(`/api/v1/customers/${job.customer_id}`)
      const customer = customerResponse.data

      // Assign job to technician
      await apiClient.put(`/api/v1/jobs/${job.id}`, {
        ...job,
        assigned_to: techId
      })

      // Prepare job details message
      const jobMessage = `NEW JOB ASSIGNED

Job #${job.job_number}: ${job.title}

Customer: ${customer.first_name} ${customer.last_name}
Phone: ${customer.phone || 'N/A'}
Address: ${customer.address_line1}, ${customer.city}, ${customer.state}

Scheduled: ${new Date(job.scheduled_date).toLocaleDateString()} at ${job.scheduled_start_time || 'TBD'}

Service: ${job.job_type || 'General'}
Priority: ${job.priority}

Description:
${job.description || 'No description provided'}

Reply "omw #${job.job_number.split('-')[1]}" when heading to job.`

      // Send SMS
      await apiClient.post('/api/v1/notifications/sms/send', {
        to: tech.phone,
        message: jobMessage,
        job_id: job.id
      })

      toast.success(`Job sent to ${tech.first_name} via SMS`)
      loadJobs()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send job via SMS')
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Send Jobs via SMS
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SmsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                SMS-Enabled Technicians
              </Typography>
              <Typography variant="h3" color="primary">{technicians.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {technicians.map(t => t.first_name).join(', ')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scheduled Jobs
              </Typography>
              <Typography variant="h3" color="info.main">{jobs.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Ready to assign via SMS
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Job #</strong></TableCell>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Scheduled</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="right"><strong>Send to Technician</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No scheduled jobs available
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.job_number}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.job_type}</TableCell>
                  <TableCell>{new Date(job.scheduled_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={job.priority} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {job.description || 'No description'}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => editJobDescription(job)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Technician</InputLabel>
                      <Select
                        value={job.assigned_to || ''}
                        onChange={(e) => sendJobViaSMS(job, e.target.value)}
                        label="Technician"
                      >
                        {technicians.map((tech) => (
                          <MenuItem key={tech.id} value={tech.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SmsIcon fontSize="small" />
                              {tech.first_name} {tech.last_name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Job Description Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job Description</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Job: <strong>#{selectedJob.job_number} - {selectedJob.title}</strong>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Job Description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter detailed job description that will be sent to technician..."
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This description will be included in the SMS sent to the technician
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveJobDescription} variant="contained">
            Save Description
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}










