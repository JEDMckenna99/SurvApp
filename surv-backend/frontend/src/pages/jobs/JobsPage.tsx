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
  IconButton,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'
import JobForm from '../../components/jobs/JobForm'

interface Job {
  id: string
  job_number: string
  title: string
  job_type?: string
  status: string
  priority: string
  scheduled_date: string
  assigned_to?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'info'
    case 'in_progress':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'error'
    case 'high':
      return 'warning'
    case 'normal':
      return 'info'
    case 'low':
      return 'default'
    default:
      return 'default'
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await apiClient.get('/api/v1/jobs')
      setJobs(response.data)
      toast.success('Jobs loaded')
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (job: Job) => {
    setSelectedJob(job)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedJob(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedJob(null)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Jobs
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Create Job
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Job #</strong></TableCell>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Scheduled Date</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>{job.job_number}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.job_type || '-'}</TableCell>
                  <TableCell>
                    {new Date(job.scheduled_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.priority}
                      color={getPriorityColor(job.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleEdit(job)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <JobForm
        open={formOpen}
        onClose={handleFormClose}
        job={selectedJob}
        onSuccess={loadJobs}
      />
    </Box>
  )
}

