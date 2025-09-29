import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Link as LinkIcon,
  BarChart as StatsIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Project, Webmaster } from '../../services/api';

interface AffiliateLanding {
  id: number;
  name: string;
  url: string;
  description: string;
  conversion_rate: number;
  clicks: number;
  orders: number;
  is_active: boolean;
}

interface WebmasterStats {
  webmaster_id: number;
  webmaster_name: string;
  clicks: number;
  orders: number;
  approved: number;
  paid: number;
  conversion: number;
  approval_rate: number;
  revenue: number;
  commission_earned: number;
  balance: number;
}

interface Commission {
  id: number;
  webmaster_id: number;
  webmaster_name: string;
  order_id: number;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  status: 'pending' | 'approved' | 'paid' | 'canceled';
  created_at: string;
}

const CPA: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [webmasters, setWebmasters] = useState<Webmaster[]>([]);
  const [landings, setLandings] = useState<AffiliateLanding[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog states
  const [openWebmasterDialog, setOpenWebmasterDialog] = useState(false);
  const [openLandingDialog, setOpenLandingDialog] = useState(false);
  const [editingWebmaster, setEditingWebmaster] = useState<Webmaster | null>(null);
  const [editingLanding, setEditingLanding] = useState<AffiliateLanding | null>(null);
  
  // Form data
  const [webmasterFormData, setWebmasterFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commission_rate: 5,
    payment_method: 'bank_transfer',
  });

  const [landingFormData, setLandingFormData] = useState({
    name: '',
    url: '',
    description: '',
  });

  // Mock data
  const mockWebmasters: Webmaster[] = [
    {
      id: 1,
      name: 'Александр Веб',
      email: 'alex@webmaster.com',
      phone: '+7 (900) 123-45-67',
      balance: 45780,
      commission_rate: 8,
      payment_method: 'bank_transfer',
      is_active: true,
      registered_at: '2024-11-15T10:00:00Z',
      last_activity: '2025-01-26T14:30:00Z'
    },
    {
      id: 2,
      name: 'Digital Pro Agency',
      email: 'manager@digitalpro.ru',
      phone: '+7 (495) 987-65-43',
      balance: 23450,
      commission_rate: 6,
      payment_method: 'qiwi',
      is_active: true,
      registered_at: '2024-12-01T09:15:00Z',
      last_activity: '2025-01-25T18:45:00Z'
    },
    {
      id: 3,
      name: 'Мария Трафик',
      email: 'maria@traffic.com',
      phone: '+7 (812) 456-78-90',
      balance: 890,
      commission_rate: 5,
      payment_method: 'yandex_money',
      is_active: false,
      registered_at: '2024-10-20T16:30:00Z',
      last_activity: '2025-01-20T12:00:00Z'
    }
  ];

  const mockLandings: AffiliateLanding[] = [
    {
      id: 1,
      name: 'Косметика Premium - Главная',
      url: 'https://cosmetics-premium.com/landing1',
      description: 'Основная посадочная страница с акцией',
      conversion_rate: 14.2,
      clicks: 15624,
      orders: 2218,
      is_active: true
    },
    {
      id: 2,
      name: 'Антивозрастная серия',
      url: 'https://cosmetics-premium.com/anti-age',
      description: 'Специальная страница для антивозрастной косметики',
      conversion_rate: 18.7,
      clicks: 8934,
      orders: 1671,
      is_active: true
    },
    {
      id: 3,
      name: 'Акция -50%',
      url: 'https://cosmetics-premium.com/sale50',
      description: 'Промо-страница с большой скидкой',
      conversion_rate: 11.3,
      clicks: 12847,
      orders: 1451,
      is_active: false
    }
  ];

  const mockWebmasterStats: WebmasterStats[] = [
    {
      webmaster_id: 1,
      webmaster_name: 'Александр Веб',
      clicks: 15624,
      orders: 1847,
      approved: 1596,
      paid: 1489,
      conversion: 11.8,
      approval_rate: 86.4,
      revenue: 8945600,
      commission_earned: 715648,
      balance: 45780
    },
    {
      webmaster_id: 2,
      webmaster_name: 'Digital Pro Agency',
      clicks: 8934,
      orders: 967,
      approved: 834,
      paid: 798,
      conversion: 10.8,
      approval_rate: 86.2,
      revenue: 4789200,
      commission_earned: 287352,
      balance: 23450
    }
  ];

  const mockCommissions: Commission[] = [
    {
      id: 1,
      webmaster_id: 1,
      webmaster_name: 'Александр Веб',
      order_id: 12345,
      amount: 5000,
      commission_amount: 400,
      commission_rate: 8,
      status: 'approved',
      created_at: '2025-01-26T10:30:00Z'
    },
    {
      id: 2,
      webmaster_id: 2,
      webmaster_name: 'Digital Pro Agency',
      order_id: 12346,
      amount: 3500,
      commission_amount: 210,
      commission_rate: 6,
      status: 'pending',
      created_at: '2025-01-26T11:15:00Z'
    },
    {
      id: 3,
      webmaster_id: 1,
      webmaster_name: 'Александр Веб',
      order_id: 12347,
      amount: 7200,
      commission_amount: 576,
      commission_rate: 8,
      status: 'paid',
      created_at: '2025-01-25T16:45:00Z'
    }
  ];

  const totalStats = {
    activeWebmasters: 2,
    totalClicks: 24558,
    totalOrders: 2814,
    totalRevenue: 13734800,
    totalCommissions: 1003000,
    pendingPayments: 69230,
    conversionRate: 11.5
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadWebmasters();
      loadLandings();
      loadCommissions();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects();
      if (response.success && response.data) {
        setProjects(response.data);
        if (response.data.length > 0) {
          setSelectedProject(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Не удалось загрузить проекты');
    }
  };

  const loadWebmasters = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      setTimeout(() => {
        setWebmasters(mockWebmasters);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading webmasters:', error);
      setError('Не удалось загрузить вебмастеров');
      setLoading(false);
    }
  };

  const loadLandings = async () => {
    try {
      // For demo purposes, use mock data
      setLandings(mockLandings);
    } catch (error) {
      console.error('Error loading landings:', error);
    }
  };

  const loadCommissions = async () => {
    try {
      // For demo purposes, use mock data
      setCommissions(mockCommissions);
    } catch (error) {
      console.error('Error loading commissions:', error);
    }
  };

  const handleCreateWebmaster = () => {
    setEditingWebmaster(null);
    setWebmasterFormData({
      name: '',
      email: '',
      phone: '',
      commission_rate: 5,
      payment_method: 'bank_transfer',
    });
    setOpenWebmasterDialog(true);
  };

  const handleCreateLanding = () => {
    setEditingLanding(null);
    setLandingFormData({
      name: '',
      url: '',
      description: '',
    });
    setOpenLandingDialog(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const generateAffiliateLink = (landingId: number, webmasterId: number) => {
    return `https://example.com/go/${landingId}?aff=${webmasterId}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'paid': return 'info';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Одобрена';
      case 'pending': return 'Ожидает';
      case 'paid': return 'Выплачена';
      case 'canceled': return 'Отменена';
      default: return status;
    }
  };

  if (!projects.length && !loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          CPA сеть
        </Typography>
        <Alert severity="info">
          У вас пока нет проектов. Создайте свой первый проект для начала работы.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          CPA сеть
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Проект</InputLabel>
            <Select
              value={selectedProject || ''}
              label="Проект"
              onChange={(e) => setSelectedProject(Number(e.target.value))}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {totalStats.activeWebmasters}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Активные вебмастера
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LinkIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {totalStats.totalClicks.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего кликов
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formatPercent(totalStats.conversionRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Средняя конверсия
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(totalStats.pendingPayments)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                К выплате
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Вебмастера" />
          <Tab label="Лендинги" />
          <Tab label="Комиссии" />
          <Tab label="Статистика" />
        </Tabs>
      </Box>

      {/* Webmasters Tab */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateWebmaster}
              >
                Пригласить вебмастера
              </Button>
            </CardActions>
          </Card>

          <Grid container spacing={3}>
            {webmasters.map((webmaster) => (
              <Grid item xs={12} md={6} lg={4} key={webmaster.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {webmaster.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {webmaster.name}
                        </Typography>
                        <Chip 
                          label={webmaster.is_active ? 'Активен' : 'Неактивен'}
                          color={webmaster.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Email:</strong> {webmaster.email}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Телефон:</strong> {webmaster.phone}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Комиссия:</strong> {webmaster.commission_rate}%
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Баланс:</strong> {formatCurrency(webmaster.balance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Регистрация:</strong> {new Date(webmaster.registered_at).toLocaleDateString('ru-RU')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <StatsIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Landings Tab */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateLanding}
              >
                Добавить лендинг
              </Button>
            </CardActions>
          </Card>

          <Grid container spacing={3}>
            {landings.map((landing) => (
              <Grid item xs={12} md={6} key={landing.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {landing.name}
                      </Typography>
                      <Chip 
                        label={landing.is_active ? 'Активен' : 'Неактивен'}
                        color={landing.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" gutterBottom>
                      {landing.description}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>URL:</strong> {landing.url}
                    </Typography>
                    
                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="center">
                          <strong>{landing.clicks.toLocaleString()}</strong>
                          <br />
                          <span style={{ color: '#666' }}>Клики</span>
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="center">
                          <strong>{landing.orders.toLocaleString()}</strong>
                          <br />
                          <span style={{ color: '#666' }}>Заказы</span>
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="center">
                          <strong>{formatPercent(landing.conversion_rate)}</strong>
                          <br />
                          <span style={{ color: '#666' }}>Конверсия</span>
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      size="small"
                      onClick={() => copyToClipboard(landing.url)}
                      title="Копировать ссылку"
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => window.open(landing.url, '_blank')}
                      title="Открыть"
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Commissions Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              История комиссий
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Вебмастер</TableCell>
                    <TableCell>Заказ</TableCell>
                    <TableCell align="right">Сумма заказа</TableCell>
                    <TableCell align="right">Комиссия</TableCell>
                    <TableCell align="right">%</TableCell>
                    <TableCell>Статус</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {new Date(commission.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>{commission.webmaster_name}</TableCell>
                      <TableCell>#{commission.order_id}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(commission.amount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(commission.commission_amount)}
                      </TableCell>
                      <TableCell align="right">
                        {commission.commission_rate}%
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(commission.status)}
                          color={getStatusColor(commission.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Statistics Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Статистика по вебмастерам
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Вебмастер</TableCell>
                        <TableCell align="right">Клики</TableCell>
                        <TableCell align="right">Заказы</TableCell>
                        <TableCell align="right">Одобрено</TableCell>
                        <TableCell align="right">Конверсия</TableCell>
                        <TableCell align="right">Подтверждение</TableCell>
                        <TableCell align="right">Выручка</TableCell>
                        <TableCell align="right">Комиссия</TableCell>
                        <TableCell align="right">Баланс</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockWebmasterStats.map((stat) => (
                        <TableRow key={stat.webmaster_id}>
                          <TableCell>
                            <Typography fontWeight="medium">
                              {stat.webmaster_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{stat.clicks.toLocaleString()}</TableCell>
                          <TableCell align="right">{stat.orders.toLocaleString()}</TableCell>
                          <TableCell align="right">{stat.approved.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={formatPercent(stat.conversion)}
                              color={stat.conversion > 10 ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{formatPercent(stat.approval_rate)}</TableCell>
                          <TableCell align="right">{formatCurrency(stat.revenue)}</TableCell>
                          <TableCell align="right">{formatCurrency(stat.commission_earned)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="primary">
                              {formatCurrency(stat.balance)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Webmaster Dialog */}
      <Dialog 
        open={openWebmasterDialog} 
        onClose={() => setOpenWebmasterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingWebmaster ? 'Редактировать вебмастера' : 'Пригласить вебмастера'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Имя*"
                value={webmasterFormData.name}
                onChange={(e) => setWebmasterFormData({ ...webmasterFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email*"
                value={webmasterFormData.email}
                onChange={(e) => setWebmasterFormData({ ...webmasterFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Телефон"
                value={webmasterFormData.phone}
                onChange={(e) => setWebmasterFormData({ ...webmasterFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Комиссия (%)"
                value={webmasterFormData.commission_rate}
                onChange={(e) => setWebmasterFormData({ ...webmasterFormData, commission_rate: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Способ выплат</InputLabel>
                <Select
                  value={webmasterFormData.payment_method}
                  label="Способ выплат"
                  onChange={(e) => setWebmasterFormData({ ...webmasterFormData, payment_method: e.target.value })}
                >
                  <MenuItem value="bank_transfer">Банковский перевод</MenuItem>
                  <MenuItem value="qiwi">QIWI</MenuItem>
                  <MenuItem value="yandex_money">ЮMoney</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWebmasterDialog(false)}>
            Отмена
          </Button>
          <Button 
            variant="contained"
            disabled={!webmasterFormData.name || !webmasterFormData.email}
          >
            {editingWebmaster ? 'Сохранить' : 'Пригласить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Landing Dialog */}
      <Dialog 
        open={openLandingDialog} 
        onClose={() => setOpenLandingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLanding ? 'Редактировать лендинг' : 'Добавить лендинг'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название*"
                value={landingFormData.name}
                onChange={(e) => setLandingFormData({ ...landingFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL*"
                value={landingFormData.url}
                onChange={(e) => setLandingFormData({ ...landingFormData, url: e.target.value })}
                placeholder="https://example.com/landing"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Описание"
                value={landingFormData.description}
                onChange={(e) => setLandingFormData({ ...landingFormData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLandingDialog(false)}>
            Отмена
          </Button>
          <Button 
            variant="contained"
            disabled={!landingFormData.name || !landingFormData.url}
          >
            {editingLanding ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CPA;