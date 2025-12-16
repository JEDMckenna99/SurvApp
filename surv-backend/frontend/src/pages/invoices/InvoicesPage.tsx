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
  Send as SendIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  status: string
  total_amount: number
  amount_paid: number
  amount_due: number
  issue_date: string
  due_date: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'success'
    case 'partial': return 'warning'
    case 'sent': return 'info'
    case 'overdue': return 'error'
    case 'draft': return 'default'
    default: return 'default'
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await apiClient.get('/api/v1/invoices')
      setInvoices(response.data)
      toast.success('Invoices loaded')
    } catch (error) {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (invoiceId: string) => {
    try {
      await apiClient.post(`/api/v1/invoices/${invoiceId}/send`)
      toast.success('Invoice marked as sent!')
      loadInvoices()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send invoice')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Invoices
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Invoice
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell><strong>Issue Date</strong></TableCell>
              <TableCell><strong>Due Date</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
              <TableCell align="right"><strong>Paid</strong></TableCell>
              <TableCell align="right"><strong>Due</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No invoices found. Create your first invoice!
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                  <TableCell align="right">${invoice.total_amount.toFixed(2)}</TableCell>
                  <TableCell align="right">${invoice.amount_paid.toFixed(2)}</TableCell>
                  <TableCell align="right">${invoice.amount_due.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {invoice.status === 'draft' && (
                      <Button
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => handleSend(invoice.id)}
                      >
                        Send
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

