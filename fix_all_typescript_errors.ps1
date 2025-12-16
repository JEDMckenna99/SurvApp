# Comprehensive TypeScript error fixes

$files = @(
    @{
        Path = "surv-backend/frontend/src/components/jobs/JobForm.tsx"
        Old = "  const [customers, setCustomers] = useState<Customer[]>([])`n  const [technicians, setTechnicians] = useState<any[]>([])`n  const [loading, setLoading] = useState(false)"
        New = "  const [customers, setCustomers] = useState<Customer[]>([])`n  const [, setTechnicians] = useState<any[]>([])`n  const [loading, setLoading] = useState(false)"
    },
    @{
        Path = "surv-backend/frontend/src/pages/invoices/InvoicesPage.tsx"
        Old = "import {`n  Add as AddIcon,`n  Send as SendIcon,`n  Payment as PaymentIcon,`n} from '@mui/icons-material'"
        New = "import {`n  Add as AddIcon,`n  Send as SendIcon,`n} from '@mui/icons-material'"
    },
    @{
        Path = "surv-backend/frontend/src/pages/jobs/JobsPage.tsx"
        Old = "interface Job {`n  id: string`n  job_number: string`n  title: string`n  job_type?: string`n  status: string`n  priority: string`n  scheduled_date: string`n  assigned_to?: string`n}"
        New = "interface Job {`n  id: string`n  job_number: string`n  title: string`n  customer_id: string`n  job_type?: string`n  status: string`n  priority: string`n  scheduled_date: string`n  assigned_to?: string`n}"
    },
    @{
        Path = "surv-backend/frontend/src/pages/schedule/SchedulePage.tsx"
        Old = "import {`n  CalendarToday as CalendarIcon,`n  NavigateBefore,`n  NavigateNext,`n} from '@mui/icons-material'"
        New = "import {`n  NavigateBefore,`n  NavigateNext,`n} from '@mui/icons-material'"
    },
    @{
        Path = "surv-backend/frontend/src/pages/schedule/SchedulePage.tsx"
        Old = "  const [jobs, setJobs] = useState<Job[]>([])`n  const [view, setView] = useState<'day' | 'week' | 'month'>('week')`n  const [currentDate, setCurrentDate] = useState(new Date())`n  const [loading, setLoading] = useState(true)"
        New = "  const [jobs, setJobs] = useState<Job[]>([])`n  const [view, setView] = useState<'day' | 'week' | 'month'>('week')`n  const [currentDate, setCurrentDate] = useState(new Date())`n  const [, setLoading] = useState(true)"
    },
    @{
        Path = "surv-backend/frontend/src/pages/technician/TechnicianDashboard.tsx"
        Old = "import {`n  Box,`n  Typography,`n  Button,`n  Paper,`n  Card,`n  CardContent,`n  Chip,`n  Grid,`n  IconButton,`n  Divider,`n} from '@mui/material'"
        New = "import {`n  Box,`n  Typography,`n  Button,`n  Paper,`n  Card,`n  CardContent,`n  Chip,`n  Grid,`n  Divider,`n} from '@mui/material'"
    },
    @{
        Path = "surv-backend/frontend/src/pages/technician/TechnicianDashboard.tsx"
        Old = "import {`n  PlayArrow as StartIcon,`n  Stop as StopIcon,`n  DirectionsCar as OnWayIcon,`n  CheckCircle as CompleteIcon,`n  Description as DetailsIcon,`n} from '@mui/icons-material'"
        New = "import {`n  PlayArrow as StartIcon,`n  Stop as StopIcon,`n  DirectionsCar as OnWayIcon,`n  CheckCircle as CompleteIcon,`n} from '@mui/icons-material'"
    },
    @{
        Path = "surv-backend/frontend/src/pages/time-tracking/TimeTrackingPage.tsx"
        Old = "  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])`n  const [isClockedIn, setIsClockedIn] = useState(false)`n  const [loading, setLoading] = useState(true)"
        New = "  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])`n  const [isClockedIn, setIsClockedIn] = useState(false)`n  const [, setLoading] = useState(true)"
    }
)

Write-Host "Fixing TypeScript errors..."
Write-Host "Done!"










