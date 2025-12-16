import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Logout as LogoutIcon,
  Payment as PaymentIcon,
  Campaign as CampaignIcon,
  EventAvailable as BookingIcon,
  Engineering as TechIcon,
  Send as SendJobIcon,
} from '@mui/icons-material'
import { RootState } from '../../store/store'
import { logout } from '../../store/authSlice'
import { toast } from 'react-toastify'

const drawerWidth = 240

// Admin & Manager menu items
const adminMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Schedule', icon: <CalendarIcon />, path: '/schedule' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
  { text: 'Send Jobs (SMS)', icon: <SendJobIcon />, path: '/send-jobs' },
  { text: 'Technicians', icon: <TechIcon />, path: '/technicians' },
  { text: 'Estimates', icon: <DescriptionIcon />, path: '/estimates' },
  { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices' },
  { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
  { text: 'Time Clock', icon: <TimeIcon />, path: '/time-tracking' },
  { text: 'Marketing', icon: <CampaignIcon />, path: '/marketing' },
  { text: 'Online Booking', icon: <BookingIcon />, path: '/booking' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
]

// Technician menu items (simplified)
const technicianMenuItems = [
  { text: 'My Jobs', icon: <WorkIcon />, path: '/' },
  { text: 'Time Clock', icon: <TimeIcon />, path: '/time-tracking' },
]

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  
  // Select menu based on user role
  const menuItems = user?.role === 'technician' ? technicianMenuItems : adminMenuItems

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          Surv
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Surv Field Service Management
          </Typography>
          <Typography variant="body2">
            {user?.first_name} {user?.last_name} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

