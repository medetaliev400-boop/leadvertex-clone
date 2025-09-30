import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: number;
  name: string;
  description: string;
  domain: string;
  status: 'active' | 'paused' | 'demo';
  tariff_name: string;
  expires_at: string;
  stats: {
    total_orders: number;
    orders_today: number;
    total_revenue: number;
    conversion_rate: number;
  };
  role: 'owner' | 'admin' | 'operator' | 'viewer';
}

const ProjectSelection: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  
  // Create project form
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    domain: '',
    tariff_id: 1,
  });

  // Mock data for projects
  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Косметика Premium',
      description: 'Интернет-магазин премиальной косметики и ухода',
      domain: 'cosmetics-premium.com',
      status: 'active',
      tariff_name: 'Бизнес',
      expires_at: '2025-02-26T00:00:00Z',
      stats: {
        total_orders: 1847,
        orders_today: 23,
        total_revenue: 2485600,
        conversion_rate: 14.2,
      },
      role: 'owner',
    },
    {
      id: 2,
      name: 'Электроника Store',
      description: 'Продажа гаджетов, смартфонов и электроники',
      domain: 'electronics-store.ru',
      status: 'active',
      tariff_name: 'Стандарт',
      expires_at: '2025-03-15T00:00:00Z',
      stats: {
        total_orders: 956,
        orders_today: 8,
        total_revenue: 3241500,
        conversion_rate: 8.9,
      },
      role: 'admin',
    },
    {
      id: 3,
      name: 'Demo Project',
      description: 'Демонстрационный проект для изучения возможностей',
      domain: 'demo.leadvertex.com',
      status: 'demo',
      tariff_name: 'Demo',
      expires_at: '2025-01-31T00:00:00Z',
      stats: {
        total_orders: 45,
        orders_today: 0,
        total_revenue: 0,
        conversion_rate: 0,
      },
      role: 'viewer',
    },
  ];

  const tariffs = [
    { id: 1, name: 'Стартер', price: 2990 },
    { id: 2, name: 'Стандарт', price: 6990 },
    { id: 3, name: 'Бизнес', price: 12990 },
    { id: 4, name: 'Корпоратив', price: 24990 },
  ];

  useEffect(() => {
    // Simulate loading projects
    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProjectSelect = (project: Project) => {
    // In a real app, you would set the selected project in context
    // and then navigate to the main app
    localStorage.setItem('selectedProject', JSON.stringify(project));
    navigate('/dashboard');
  };

  const handleCreateProject = async () => {
    // Simulate project creation
    const newProject: Project = {
      id: Date.now(),
      name: projectForm.name,
      description: projectForm.description,
      domain: projectForm.domain,
      status: 'active',
      tariff_name: tariffs.find(t => t.id === projectForm.tariff_id)?.name || 'Стартер',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        total_orders: 0,
        orders_today: 0,
        total_revenue: 0,
        conversion_rate: 0,
      },
      role: 'owner',
    };

    setProjects(prev => [...prev, newProject]);
    setOpenCreateDialog(false);
    setProjectForm({ name: '', description: '', domain: '', tariff_id: 1 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'demo': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'paused': return 'Приостановлен';
      case 'demo': return 'Демо';
      default: return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner': return 'Владелец';
      case 'admin': return 'Администратор';
      case 'operator': return 'Оператор';
      case 'viewer': return 'Наблюдатель';
      default: return role;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                backgroundColor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <Typography variant="h6" color="white" fontWeight="bold">
                LV
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              LeadVertex
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <IconButton onClick={handleLogout} color="inherit">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Добро пожаловать, {user?.first_name || 'Пользователь'}!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Выберите проект для работы или создайте новый
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {projects.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего проектов
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {projects.filter(p => p.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Активных
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {projects.reduce((sum, p) => sum + p.stats.orders_today, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Заказов сегодня
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {formatCurrency(projects.reduce((sum, p) => sum + p.stats.total_revenue, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Общая выручка
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Projects Grid */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Ваши проекты
          </Typography>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Создать проект
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleProjectSelect(project)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {project.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {project.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.domain}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, project)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={getStatusText(project.status)}
                      color={getStatusColor(project.status) as any}
                      size="small"
                    />
                    <Chip
                      label={getRoleText(project.role)}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={project.tariff_name}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {project.stats.total_orders}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Всего заказов
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {project.stats.orders_today}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Сегодня
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(project.stats.total_revenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Выручка
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {project.stats.conversion_rate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Конверсия
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<LaunchIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectSelect(project);
                    }}
                  >
                    Открыть проект
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {projects.length === 0 && (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              У вас пока нет проектов
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Создайте свой первый проект, чтобы начать работу с LeadVertex
            </Typography>
            {user?.role === 'admin' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
              >
                Создать первый проект
              </Button>
            )}
          </Paper>
        )}
      </Container>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} />
          Настройки
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Создать новый проект</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Название проекта"
              value={projectForm.name}
              onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Описание"
              value={projectForm.description}
              onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Домен"
              value={projectForm.domain}
              onChange={(e) => setProjectForm(prev => ({ ...prev, domain: e.target.value }))}
              margin="normal"
              placeholder="example.com"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Тарифный план</InputLabel>
              <Select
                value={projectForm.tariff_id}
                onChange={(e) => setProjectForm(prev => ({ ...prev, tariff_id: e.target.value as number }))}
              >
                {tariffs.map((tariff) => (
                  <MenuItem key={tariff.id} value={tariff.id}>
                    {tariff.name} - {formatCurrency(tariff.price)}/мес.
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!projectForm.name || !projectForm.domain}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectSelection;