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
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface Estimate {
  id: string
  estimate_number: string
  title: string
  customer_id: string
  status: string
  total_amount: number
  valid_until: string
  created_at: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'default'
    case 'sent': return 'info'
    case 'approved': return 'success'
    case 'declined': return 'error'
    case 'expired': return 'warning'
    default: return 'default'
  }
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEstimates()
  }, [])

  const loadEstimates = async () => {
    try {
      const response = await apiClient.get('/api/v1/estimates')
      setEstimates(response.data)
      toast.success('Estimates loaded')
    } catch (error) {
      toast.error('Failed to load estimates')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (estimateId: string) => {
    try {
      await apiClient.post(`/api/v1/estimates/${estimateId}/approve?create_job=true`)
      toast.success('Estimate approved and job created!')
      loadEstimates()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to approve estimate')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Estimates & Quotes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Estimate
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Estimate #</strong></TableCell>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Total Amount</strong></TableCell>
              <TableCell><strong>Valid Until</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : estimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No estimates found. Create your first estimate!
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((estimate) => (
                <TableRow key={estimate.id} hover>
                  <TableCell>{estimate.estimate_number}</TableCell>
                  <TableCell>{estimate.title}</TableCell>
                  <TableCell>${estimate.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(estimate.valid_until).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={estimate.status}
                      color={getStatusColor(estimate.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {estimate.status === 'sent' && (
                      <Button
                        size="small"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleApprove(estimate.id)}
                      >
                        Approve & Convert
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

