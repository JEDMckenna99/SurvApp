import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface Customer {
  id: string
  first_name: string
  last_name: string
}

interface Job {
  id?: string
  title: string
  description?: string
  customer_id: string
  job_type?: string
  scheduled_date: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  estimated_duration?: number
  priority: string
  assigned_to?: string
}

interface Props {
  open: boolean
  onClose: () => void
  job?: Job | null
  onSuccess: () => void
}

export default function JobForm({ open, onClose, job, onSuccess }: Props) {
  const [formData, setFormData] = useState<Job>(job || {
    title: '',
    description: '',
    customer_id: '',
    job_type: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_start_time: '',
    scheduled_end_time: '',
    estimated_duration: 120,
    priority: 'normal',
    assigned_to: '',
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCustomers()
    loadTechnicians()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await apiClient.get('/api/v1/customers')
      setCustomers(response.data)
    } catch (error) {
      toast.error('Failed to load customers')
    }
  }

  const loadTechnicians = async () => {
    try {
      // In a real app, we'd have an endpoint to get users by role
      // For now, we'll just show the test technician
      setTechnicians([])
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (job?.id) {
        // Update existing job
        await apiClient.put(`/api/v1/jobs/${job.id}`, formData)
        toast.success('Job updated successfully!')
      } else {
        // Create new job
        await apiClient.post('/api/v1/jobs', formData)
        toast.success('Job created successfully!')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {job?.id ? 'Edit Job' : 'Create New Job'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  label="Customer"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Type"
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                placeholder="e.g. Plumbing, HVAC, Electrical"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Scheduled Date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Start Time"
                name="scheduled_start_time"
                value={formData.scheduled_start_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="End Time"
                name="scheduled_end_time"
                value={formData.scheduled_end_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Duration (minutes)"
                name="estimated_duration"
                value={formData.estimated_duration}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

