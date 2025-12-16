import { useState, useEffect } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  Payment as PaymentIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  total_amount: number
  amount_paid: number
  amount_due: number
  status: string
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')

  useEffect(() => {
    loadUnpaidInvoices()
  }, [])

  const loadUnpaidInvoices = async () => {
    try {
      const response = await apiClient.get('/api/v1/invoices')
      const unpaid = response.data.filter((inv: Invoice) => 
        inv.status !== 'paid' && inv.status !== 'void'
      )
      setInvoices(unpaid)
    } catch (error) {
      toast.error('Failed to load invoices')
    }
  }

  const handlePayment = async () => {
    if (!selectedInvoice) return

    try {
      if (paymentMethod === 'card') {
        // Stripe integration (mock for now)
        const intentResponse = await apiClient.post('/api/v1/payments/create-payment-intent', {
          invoice_id: selectedInvoice.id,
          amount: parseFloat(paymentAmount),
          payment_method: 'card',
        })

        // In production, use Stripe.js here
        // const stripe = await loadStripe(STRIPE_PUBLIC_KEY)
        // const { error } = await stripe.confirmCardPayment(intentResponse.data.client_secret)

        // For now, just confirm the payment
        await apiClient.post('/api/v1/payments/confirm-payment', {
          payment_intent_id: intentResponse.data.client_secret,
          invoice_id: selectedInvoice.id,
        })
      } else {
        // Manual payment (cash, check, ACH)
        await apiClient.post('/api/v1/payments/record-payment', null, {
          params: {
            invoice_id: selectedInvoice.id,
            amount: parseFloat(paymentAmount),
            payment_method: paymentMethod,
          },
        })
      }

      toast.success('Payment recorded successfully')
      setPaymentDialogOpen(false)
      setSelectedInvoice(null)
      setPaymentAmount('')
      loadUnpaidInvoices()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Payment failed')
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentAmount(invoice.amount_due.toString())
    setPaymentDialogOpen(true)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Payment Processing
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <CardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Credit Cards</Typography>
              <Typography variant="body2" color="text.secondary">
                Accept Visa, Mastercard, Amex, Discover
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <BankIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">ACH/Bank Transfer</Typography>
              <Typography variant="body2" color="text.secondary">
                Accept direct bank payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <PaymentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Cash & Check</Typography>
              <Typography variant="body2" color="text.secondary">
                Record manual payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        Unpaid Invoices
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Paid</strong></TableCell>
              <TableCell><strong>Due</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No unpaid invoices
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                  <TableCell>${invoice.amount_paid.toFixed(2)}</TableCell>
                  <TableCell><strong>${invoice.amount_due.toFixed(2)}</strong></TableCell>
                  <TableCell>
                    <Chip label={invoice.status} color="warning" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => openPaymentDialog(invoice)}
                    >
                      Record Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Invoice: <strong>{selectedInvoice.invoice_number}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Amount Due: <strong>${selectedInvoice.amount_due.toFixed(2)}</strong>
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
                inputProps={{ step: '0.01', min: '0' }}
              />

              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="card">Credit Card</MenuItem>
                  <MenuItem value="ach">ACH/Bank Transfer</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePayment} variant="contained">
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}











