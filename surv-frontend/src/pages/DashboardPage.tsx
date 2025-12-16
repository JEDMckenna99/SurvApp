import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Paper, Card, CardContent } from '@mui/material'
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { apiClient } from '../api/client'
import { toast } from 'react-toastify'

const StatCard = ({ title, value, icon, color }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/reports/dashboard')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <Typography>Loading dashboard...</Typography>
    </Box>
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to Surv Field Service Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats?.customers?.total || 0}
            icon={<PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats?.jobs?.active || 0}
            icon={<WorkIcon sx={{ fontSize: 40, color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invoices"
            value={stats?.invoices?.total || 0}
            icon={<ReceiptIcon sx={{ fontSize: 40, color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue"
            value={`$${stats?.revenue?.total?.toFixed(2) || '0.00'}`}
            icon={<TrendingUpIcon sx={{ fontSize: 40, color: 'error.main' }} />}
            color="error"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Today's Overview
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Jobs scheduled for today: <strong>{stats?.jobs?.today || 0}</strong>
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Completed jobs: <strong>{stats?.jobs?.completed || 0}</strong>
          </Typography>
          <Typography variant="body1">
            Outstanding invoices: <strong>${stats?.revenue?.outstanding?.toFixed(2) || '0.00'}</strong>
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

