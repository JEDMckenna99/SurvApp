import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  Container,
} from '@mui/material'
import { CalendarToday, CheckCircle } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

export default function OnlineBookingPage() {
  const [services, setServices] = useState<any[]>([])
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
    zip_code: '',
    service_type: '',
    description: '',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time: '09:00',
  })
  const [submitted, setSubmitted] = useState(false)
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const response = await apiClient.get('/api/v1/booking/services')
      setServices(response.data.services)
    } catch (error) {
      console.error('Failed to load services')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await apiClient.post('/api/v1/booking/submit', formData)
      setBookingConfirmation(response.data)
      setSubmitted(true)
      toast.success('Booking request submitted successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Booking failed')
    }
  }

  if (submitted) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Paper sx={{ p: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Thank you for choosing Surv. Your booking request has been received.
            </Typography>
            {bookingConfirmation && (
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Booking Details:
                  </Typography>
                  <Typography variant="body2">
                    Job Number: <strong>{bookingConfirmation.job_number}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {bookingConfirmation.confirmation}
                  </Typography>
                </CardContent>
              </Card>
            )}
            <Button variant="contained" onClick={() => { setSubmitted(false); setBookingConfirmation(null) }}>
              Book Another Service
            </Button>
          </Paper>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Book a Service Online
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule your service appointment in just a few clicks
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Service Address
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Service Details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  label="Service Type"
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.name}>
                      {service.name} - {service.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Describe Your Issue"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe what needs to be done..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Preferred Date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred Time</InputLabel>
                <Select
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  label="Preferred Time"
                >
                  <MenuItem value="08:00">8:00 AM</MenuItem>
                  <MenuItem value="10:00">10:00 AM</MenuItem>
                  <MenuItem value="12:00">12:00 PM</MenuItem>
                  <MenuItem value="14:00">2:00 PM</MenuItem>
                  <MenuItem value="16:00">4:00 PM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<CalendarToday />}
              sx={{ px: 6 }}
            >
              Submit Booking Request
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}











