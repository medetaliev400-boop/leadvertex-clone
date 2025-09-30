import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Assessment as StatsIcon,
  Phone as PhoneIcon,
  Language as LandingIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  ExpandMore as ExpandMoreIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  AttachMoney as MoneyIcon,
  Store as StoreIcon,
  Groups as GroupsIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Project, User, ProjectSettings } from '../../services/api';

interface ProjectFormData {
  name: string;
  description: string;
  domain: string;
  currency: string;
  timezone: string;
  auto_renewal: boolean;
  tariff_id: number | null;
  clone_from_project_id: number | null;
}

interface ProjectMember {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  role: string;
  permissions: string[];
  invited_at: string;
  last_activity: string;
  is_active: boolean;
}

interface ProjectStats {
  total_orders: number;
  orders_today: number;
  total_revenue: number;
  conversion_rate: number;
  active_operators: number;
  active_products: number;
}

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Form data
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    domain: '',
    currency: 'RUB',
    timezone: 'Europe/Moscow',
    auto_renewal: true,
    tariff_id: null,
    clone_from_project_id: null,
  });

  // Tab management
  const [activeTab, setActiveTab] = useState(0);

  // Mock data
  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Косметика Premium',
      description: 'Интернет-магазин премиальной косметики',
      domain: 'cosmetics-premium.com',
      currency: 'RUB',
      timezone: 'Europe/Moscow',
      status: 'active',
      tariff_name: 'Бизнес',
      expires_at: '2025-02-26T00:00:00Z',
      auto_renewal: true,
      created_at: '2024-12-01T10:00:00Z',
      stats: {
        total_orders: 1847,
        orders_today: 23,
        total_revenue: 2485600,
        conversion_rate: 14.2,
        active_operators: 5,
        active_products: 28
      }
    },
    {
      id: 2,
      name: 'Электроника Store',
      description: 'Продажа гаджетов и электроники',
      domain: 'electronics-store.ru',
      currency: 'RUB',
      timezone: 'Europe/Moscow',
      status: 'active',
      tariff_name: 'Стандарт',
      expires_at: '2025-03-15T00:00:00Z',
      auto_renewal: false,
      created_at: '2024-11-15T14:30:00Z',
      stats: {
        total_orders: 956,
        orders_today: 8,
        total_revenue: 3241500,
        conversion_rate: 8.9,
        active_operators: 3,
        active_products: 45
      }
    },
    {
      id: 3,
      name: 'Demo Project',
      description: 'Демонстрационный проект для обучения',
      domain: 'demo.leadvertex.com',
      currency: 'RUB',
      timezone: 'Europe/Moscow',
      status: 'demo',
      tariff_name: 'Demo',
      expires_at: '2025-01-31T00:00:00Z',
      auto_renewal: false,
      created_at: '2025-01-01T00:00:00Z',
      stats: {
        total_orders: 45,
        orders_today: 0,
        total_revenue: 0,
        conversion_rate: 0,
        active_operators: 1,
        active_products: 5
      }
    }
  ];

  const mockProjectMembers: ProjectMember[] = [
    {
      id: 1,
      user_id: 1,
      user_name: 'Анна Петрова',
      user_email: 'anna@example.com',
      role: 'operator',
      permissions: ['view_orders', 'edit_orders', 'call_customers'],
      invited_at: '2024-12-01T10:00:00Z',
      last_activity: '2025-01-26T14:30:00Z',
      is_active: true
    },
    {
      id: 2,
      user_id: 2,
      user_name: 'Михаил Сидоров',
      user_email: 'mikhail@example.com',
      role: 'manager',
      permissions: ['view_orders', 'edit_orders', 'view_statistics', 'manage_products'],
      invited_at: '2024-12-05T09:15:00Z',
      last_activity: '2025-01-26T12:00:00Z',
      is_active: true
    },
    {
      id: 3,
      user_id: 3,
      user_name: 'Елена Козлова',
      user_email: 'elena@example.com',
      role: 'packer',
      permissions: ['view_orders', 'update_shipping'],
      invited_at: '2024-12-10T16:45:00Z',
      last_activity: '2025-01-25T18:20:00Z',
      is_active: false
    }
  ];

  const tariffs = [
    { id: 1, name: 'Стартер', price: 2990, features: ['До 1000 заказов', 'Базовая CRM', 'Email поддержка'] },
    { id: 2, name: 'Стандарт', price: 6990, features: ['До 5000 заказов', 'CRM + Телефония', 'Приоритетная поддержка'] },
    { id: 3, name: 'Бизнес', price: 12990, features: ['Безлимитные заказы', 'Полный функционал', 'Персональный менеджер'] },
    { id: 4, name: 'Корпоратив', price: 24990, features: ['Enterprise решение', 'API доступ', 'Индивидуальные настройки'] },
  ];

  const currencies = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
    { code: 'UAH', name: 'Украинская гривна' },
    { code: 'KZT', name: 'Казахстанский тенге' },
  ];

  const timezones = [
    'Europe/Moscow',
    'Europe/Kiev',
    'Asia/Almaty',
    'Europe/Minsk',
    'UTC',
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      // In real app: const response = await apiService.getProjects();
      setTimeout(() => {
        setProjects(mockProjects);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Не удалось загрузить проекты');
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectFormData({
      name: '',
      description: '',
      domain: '',
      currency: 'RUB',
      timezone: 'Europe/Moscow',
      auto_renewal: true,
      tariff_id: null,
      clone_from_project_id: null,
    });
    setOpenProjectDialog(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description,
      domain: project.domain,
      currency: project.currency,
      timezone: project.timezone,
      auto_renewal: project.auto_renewal,
      tariff_id: null, // Will be set from project.tariff_id in real app
      clone_from_project_id: null,
    });
    setOpenProjectDialog(true);
  };

  const handleSaveProject = async () => {
    try {
      if (editingProject) {
        // await apiService.updateProject(editingProject.id, projectFormData);
        console.log('Updating project:', projectFormData);
      } else {
        // await apiService.createProject(projectFormData);
        console.log('Creating project:', projectFormData);
      }
      setOpenProjectDialog(false);
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Не удалось сохранить проект');
    }
  };

  const handleManageMembers = (project: Project) => {
    setSelectedProject(project);
    setOpenMembersDialog(true);
  };

  const handleProjectSettings = (project: Project) => {
    setSelectedProject(project);
    setOpenSettingsDialog(true);
  };

  const toggleProjectStatus = async (project: Project) => {
    try {
      const newStatus = project.status === 'active' ? 'paused' : 'active';
      // await apiService.updateProjectStatus(project.id, newStatus);
      console.log('Toggle project status:', project.id, newStatus);
      loadProjects();
    } catch (error) {
      console.error('Error toggling project status:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'expired': return 'error';
      case 'demo': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'paused': return 'Приостановлен';
      case 'expired': return 'Истёк';
      case 'demo': return 'Демо';
      default: return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'operator': return 'Оператор';
      case 'packer': return 'Упаковщик';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'operator': return 'primary';
      case 'packer': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Мои проекты
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
        >
          Создать проект
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} lg={6} xl={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Project Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {project.name}
                      </Typography>
                      <Chip 
                        label={getStatusText(project.status)} 
                        color={getStatusColor(project.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleProjectStatus(project)}
                      color={project.status === 'active' ? 'error' : 'success'}
                    >
                      {project.status === 'active' ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                  </Box>

                  {/* Project Info */}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {project.description}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Домен:</strong> {project.domain}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Тариф:</strong> {project.tariff_name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    <strong>Истекает:</strong> {formatDate(project.expires_at)}
                    {project.auto_renewal && (
                      <Chip label="Автопродление" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>

                  {/* Project Stats */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          {project.stats.total_orders.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Всего заказов
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(project.stats.total_revenue, project.currency)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Выручка
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6">
                          {project.stats.orders_today}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Сегодня
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6">
                          {project.stats.conversion_rate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Конверсия
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditProject(project)}
                      title="Редактировать"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleProjectSettings(project)}
                      title="Настройки"
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleManageMembers(project)}
                      title="Пользователи"
                    >
                      <PeopleIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Button 
                    size="small" 
                    variant="contained"
                    startIcon={<LaunchIcon />}
                    onClick={() => console.log('Open project:', project.id)}
                  >
                    Открыть
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog 
        open={openProjectDialog} 
        onClose={() => setOpenProjectDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProject ? 'Редактировать проект' : 'Создать проект'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Название проекта*"
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Домен"
                value={projectFormData.domain}
                onChange={(e) => setProjectFormData({ ...projectFormData, domain: e.target.value })}
                placeholder="example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Описание"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Тариф</InputLabel>
                <Select
                  value={projectFormData.tariff_id || ''}
                  label="Тариф"
                  onChange={(e) => setProjectFormData({ ...projectFormData, tariff_id: Number(e.target.value) || null })}
                >
                  {tariffs.map((tariff) => (
                    <MenuItem key={tariff.id} value={tariff.id}>
                      {tariff.name} - {formatCurrency(tariff.price)}/мес
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Валюта</InputLabel>
                <Select
                  value={projectFormData.currency}
                  label="Валюта"
                  onChange={(e) => setProjectFormData({ ...projectFormData, currency: e.target.value })}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Часовой пояс</InputLabel>
                <Select
                  value={projectFormData.timezone}
                  label="Часовой пояс"
                  onChange={(e) => setProjectFormData({ ...projectFormData, timezone: e.target.value })}
                >
                  {timezones.map((timezone) => (
                    <MenuItem key={timezone} value={timezone}>
                      {timezone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {!editingProject && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Клонировать настройки из</InputLabel>
                  <Select
                    value={projectFormData.clone_from_project_id || ''}
                    label="Клонировать настройки из"
                    onChange={(e) => setProjectFormData({ ...projectFormData, clone_from_project_id: Number(e.target.value) || null })}
                  >
                    <MenuItem value="">Создать с базовыми настройками</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={projectFormData.auto_renewal}
                    onChange={(e) => setProjectFormData({ ...projectFormData, auto_renewal: e.target.checked })}
                  />
                }
                label="Автоматическое продление"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectDialog(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSaveProject}
            variant="contained"
            disabled={!projectFormData.name || !projectFormData.tariff_id}
          >
            {editingProject ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Members Dialog */}
      <Dialog 
        open={openMembersDialog} 
        onClose={() => setOpenMembersDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Пользователи проекта: {selectedProject?.name}
        </DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => console.log('Invite user')}
            >
              Пригласить пользователя
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Последняя активность</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockProjectMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {member.user_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {member.user_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.user_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleText(member.role)} 
                        color={getRoleColor(member.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.is_active ? 'Активен' : 'Неактивен'} 
                        color={member.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(member.last_activity)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Settings Dialog */}
      <Dialog 
        open={openSettingsDialog} 
        onClose={() => setOpenSettingsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Настройки проекта: {selectedProject?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Телефония
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Настройка исходящих звонков и SIP
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Настроить</Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <LandingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Лендинги
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Управление посадочными страницами
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Настроить</Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Интеграции
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Службы доставки и платежные системы
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Настроить</Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Автоматизация
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Роботы и автоматические действия
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Настроить</Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;