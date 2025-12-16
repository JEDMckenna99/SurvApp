import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

const StatCard = ({ title, value, subtitle, icon, color }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 2,
            p: 2,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export default function ReportsPage() {
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/reports/dashboard')
      setDashboardStats(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !dashboardStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography>Loading analytics...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Reports & Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Business performance and insights
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={dashboardStats.customers.total}
            subtitle={`${dashboardStats.customers.active} active`}
            icon={<PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={dashboardStats.jobs.active}
            subtitle={`${dashboardStats.jobs.completed} completed`}
            icon={<WorkIcon sx={{ fontSize: 40, color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${dashboardStats.revenue.total.toFixed(2)}`}
            subtitle={`$${dashboardStats.revenue.this_month.toFixed(2)} this month`}
            icon={<MoneyIcon sx={{ fontSize: 40, color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Outstanding"
            value={`$${dashboardStats.revenue.outstanding.toFixed(2)}`}
            subtitle={`${dashboardStats.invoices.unpaid} unpaid invoices`}
            icon={<TrendingUpIcon sx={{ fontSize: 40, color: 'error.main' }} />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Jobs Overview
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Jobs</TableCell>
                    <TableCell align="right">{dashboardStats.jobs.total}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Active Jobs</TableCell>
                    <TableCell align="right">{dashboardStats.jobs.active}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Completed Jobs</TableCell>
                    <TableCell align="right">{dashboardStats.jobs.completed}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Today's Jobs</TableCell>
                    <TableCell align="right">{dashboardStats.jobs.today}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Invoice Summary
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Invoices</TableCell>
                    <TableCell align="right">{dashboardStats.invoices.total}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Paid</TableCell>
                    <TableCell align="right">{dashboardStats.invoices.paid}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unpaid</TableCell>
                    <TableCell align="right">{dashboardStats.invoices.unpaid}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

