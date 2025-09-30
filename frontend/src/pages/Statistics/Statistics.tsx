import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Phone as PhoneIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  Speed as ConversionIcon,
  Schedule as TimeIcon,
  LocalShipping as ShippingIcon,
  SmartToy as RobotIcon,
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  ComposedChart, Legend,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Project } from '../../services/api';

interface StatisticsFilters {
  project_id: number | null;
  date_from: Date | null;
  date_to: Date | null;
  period: string;
}

interface ConversionStats {
  period: string;
  visitors: number;
  orders: number;
  approved: number;
  shipped: number;
  paid: number;
  returned: number;
  canceled: number;
  conversion_rate: number;
  approval_rate: number;
  payment_rate: number;
  return_rate: number;
  revenue: number;
  avg_check: number;
}

interface OperatorStats {
  operator_id: number;
  operator_name: string;
  calls_made: number;
  calls_answered: number;
  orders_processed: number;
  orders_approved: number;
  working_time: number;
  talk_time: number;
  approval_rate: number;
  avg_call_duration: number;
  revenue_generated: number;
}

interface ProductStats {
  product_id: number;
  product_name: string;
  orders_count: number;
  revenue: number;
  profit: number;
  return_rate: number;
  avg_price: number;
  quantity_sold: number;
}

interface CallStats {
  period: string;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  avg_call_duration: number;
  total_talk_time: number;
  answer_rate: number;
  peak_hour: string;
  busiest_day: string;
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
  sources: string[];
}

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<StatisticsFilters>({
    project_id: null,
    date_from: new Date(new Date().setDate(new Date().getDate() - 30)),
    date_to: new Date(),
    period: 'day',
  });

  // Mock data for demonstration
  const mockConversionStats: ConversionStats[] = [
    {
      period: '2025-01-20',
      visitors: 2847,
      orders: 342,
      approved: 298,
      shipped: 267,
      paid: 245,
      returned: 22,
      canceled: 44,
      conversion_rate: 12.0,
      approval_rate: 87.1,
      payment_rate: 91.8,
      return_rate: 9.0,
      revenue: 1235000,
      avg_check: 5041
    },
    {
      period: '2025-01-21',
      visitors: 3156,
      orders: 389,
      approved: 327,
      shipped: 298,
      paid: 271,
      returned: 27,
      canceled: 62,
      conversion_rate: 12.3,
      approval_rate: 84.1,
      payment_rate: 90.9,
      return_rate: 10.0,
      revenue: 1456700,
      avg_check: 5376
    },
    {
      period: '2025-01-22',
      visitors: 2934,
      orders: 367,
      approved: 312,
      shipped: 289,
      paid: 268,
      returned: 21,
      canceled: 55,
      conversion_rate: 12.5,
      approval_rate: 85.0,
      payment_rate: 92.7,
      return_rate: 7.8,
      revenue: 1389400,
      avg_check: 5184
    }
  ];

  const mockOperatorStats: OperatorStats[] = [
    {
      operator_id: 1,
      operator_name: 'Анна Петрова',
      calls_made: 156,
      calls_answered: 134,
      orders_processed: 89,
      orders_approved: 76,
      working_time: 480, // minutes
      talk_time: 342, // minutes
      approval_rate: 85.4,
      avg_call_duration: 2.6, // minutes
      revenue_generated: 456700
    },
    {
      operator_id: 2,
      operator_name: 'Михаил Сидоров',
      calls_made: 198,
      calls_answered: 167,
      orders_processed: 112,
      orders_approved: 94,
      working_time: 480,
      talk_time: 389,
      approval_rate: 83.9,
      avg_call_duration: 2.3,
      revenue_generated: 578900
    },
    {
      operator_id: 3,
      operator_name: 'Елена Козлова',
      calls_made: 143,
      calls_answered: 119,
      orders_processed: 78,
      orders_approved: 69,
      working_time: 480,
      talk_time: 298,
      approval_rate: 88.5,
      avg_call_duration: 2.5,
      revenue_generated: 398500
    }
  ];

  const mockProductStats: ProductStats[] = [
    {
      product_id: 1,
      product_name: 'iPhone 15 Pro',
      orders_count: 145,
      revenue: 17400000,
      profit: 5800000,
      return_rate: 3.4,
      avg_price: 120000,
      quantity_sold: 145
    },
    {
      product_id: 2,
      product_name: 'AirPods Pro 2',
      orders_count: 89,
      revenue: 2225000,
      profit: 890000,
      return_rate: 2.2,
      avg_price: 25000,
      quantity_sold: 89
    },
    {
      product_id: 3,
      product_name: 'Крем Anti-Age',
      orders_count: 234,
      revenue: 585000,
      profit: 397800,
      return_rate: 1.7,
      avg_price: 2500,
      quantity_sold: 234
    }
  ];

  const mockCallStats: CallStats[] = [
    {
      period: '2025-01-26',
      total_calls: 1247,
      answered_calls: 1089,
      missed_calls: 158,
      avg_call_duration: 2.4,
      total_talk_time: 2613.6,
      answer_rate: 87.3,
      peak_hour: '14:00-15:00',
      busiest_day: 'Вторник'
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
      commission_earned: 447280,
      sources: ['Facebook', 'Google', 'Instagram']
    },
    {
      webmaster_id: 2,
      webmaster_name: 'Digital Pro',
      clicks: 8934,
      orders: 967,
      approved: 834,
      paid: 798,
      conversion: 10.8,
      approval_rate: 86.2,
      revenue: 4789200,
      commission_earned: 239460,
      sources: ['TikTok', 'YouTube']
    }
  ];

  const dailyRevenueData = [
    { date: '20.01', revenue: 1235000, orders: 342, conversion: 12.0 },
    { date: '21.01', revenue: 1456700, orders: 389, conversion: 12.3 },
    { date: '22.01', revenue: 1389400, orders: 367, conversion: 12.5 },
    { date: '23.01', revenue: 1567800, orders: 423, conversion: 13.1 },
    { date: '24.01', revenue: 1234500, orders: 334, conversion: 11.8 },
    { date: '25.01', revenue: 1678900, orders: 456, conversion: 13.4 },
    { date: '26.01', revenue: 1445600, orders: 387, conversion: 12.7 },
  ];

  const orderStatusData = [
    { name: 'Принят', value: 1847, color: '#4caf50' },
    { name: 'Обработка', value: 234, color: '#2196f3' },
    { name: 'Отправлен', value: 567, color: '#ff9800' },
    { name: 'Доставлен', value: 1234, color: '#9c27b0' },
    { name: 'Возврат', value: 89, color: '#f44336' },
    { name: 'Отменен', value: 156, color: '#795548' }
  ];

  const conversionFunnelData = [
    { stage: 'Посетители', count: 28473, rate: 100 },
    { stage: 'Заказы', count: 3458, rate: 12.1 },
    { stage: 'Приняты', count: 2987, rate: 86.4 },
    { stage: 'Отправлены', count: 2734, rate: 91.5 },
    { stage: 'Оплачены', count: 2456, rate: 89.8 }
  ];

  const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#795548'];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (filters.project_id) {
      loadStatistics();
    }
  }, [filters]);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects();
      if (response.success && response.data && Array.isArray(response.data)) {
        setProjects(response.data);
        if (response.data.length > 0) {
          setFilters(prev => ({ ...prev, project_id: response.data![0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Не удалось загрузить проекты');
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      // In real app: const response = await apiService.getStatistics(filters);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setError('Не удалось загрузить статистику');
      setLoading(false);
    }
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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  if (!projects.length && !loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Статистика
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
          Статистика
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Проект</InputLabel>
            <Select
              value={filters.project_id || ''}
              label="Проект"
              onChange={(e) => setFilters({ ...filters, project_id: Number(e.target.value) })}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Период</InputLabel>
            <Select
              value={filters.period}
              label="Период"
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            >
              <MenuItem value="day">День</MenuItem>
              <MenuItem value="week">Неделя</MenuItem>
              <MenuItem value="month">Месяц</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton onClick={() => loadStatistics()}>
            <RefreshIcon />
          </IconButton>
          
          <Button startIcon={<DownloadIcon />} variant="outlined">
            Экспорт
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                <DatePicker
                  label="Дата с"
                  value={filters.date_from}
                  onChange={(newValue) => setFilters({ ...filters, date_from: newValue })}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                <DatePicker
                  label="Дата по"
                  value={filters.date_to}
                  onChange={(newValue) => setFilters({ ...filters, date_to: newValue })}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Конверсии" />
          <Tab label="Операторы" />
          <Tab label="По выкупаемости" />
          <Tab label="Товары" />
          <Tab label="Звонки" />
          <Tab label="По робо-прозвону" />
          <Tab label="Вебмастера" />
          <Tab label="Воронка продаж" />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Conversions Tab */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3}>
                {/* Key Metrics */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <CustomersIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            28,473
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Посетители
                          </Typography>
                          <Chip 
                            icon={<TrendingUpIcon />}
                            label="+12.4%" 
                            color="success" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <OrdersIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            3,458
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Заказы
                          </Typography>
                          <Chip 
                            icon={<TrendingUpIcon />}
                            label="+8.7%" 
                            color="success" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <ConversionIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            12.1%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Конверсия
                          </Typography>
                          <Chip 
                            icon={<TrendingUpIcon />}
                            label="+0.3%" 
                            color="success" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <RevenueIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            18.9M
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Выручка
                          </Typography>
                          <Chip 
                            icon={<TrendingUpIcon />}
                            label="+15.2%" 
                            color="success" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <AssessmentIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            86.4%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Подтверждение
                          </Typography>
                          <Chip 
                            icon={<TrendingDownIcon />}
                            label="-1.1%" 
                            color="warning" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <RevenueIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            5,468
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Средний чек
                          </Typography>
                          <Chip 
                            icon={<TrendingUpIcon />}
                            label="+3.5%" 
                            color="success" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Revenue Chart */}
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Динамика выручки и заказов
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={dailyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(Number(value)) : value,
                              name === 'revenue' ? 'Выручка' : name === 'orders' ? 'Заказы' : 'Конверсия %'
                            ]}
                          />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#e3f2fd" stroke="#2196f3" strokeWidth={2} />
                          <Bar yAxisId="left" dataKey="orders" fill="#4caf50" />
                          <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#ff9800" strokeWidth={3} dot={{ fill: '#ff9800' }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Order Status Pie */}
                <Grid item xs={12} lg={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Распределение заказов
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Заказов']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Detailed Table */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Детальная статистика по конверсиям
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Дата</TableCell>
                              <TableCell align="right">Посетители</TableCell>
                              <TableCell align="right">Заказы</TableCell>
                              <TableCell align="right">Приняты</TableCell>
                              <TableCell align="right">Оплачены</TableCell>
                              <TableCell align="right">Конверсия</TableCell>
                              <TableCell align="right">Подтверждение</TableCell>
                              <TableCell align="right">Выручка</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mockConversionStats.map((stat, index) => (
                              <TableRow key={index}>
                                <TableCell>{new Date(stat.period).toLocaleDateString('ru-RU')}</TableCell>
                                <TableCell align="right">{stat.visitors.toLocaleString()}</TableCell>
                                <TableCell align="right">{stat.orders.toLocaleString()}</TableCell>
                                <TableCell align="right">{stat.approved.toLocaleString()}</TableCell>
                                <TableCell align="right">{stat.paid.toLocaleString()}</TableCell>
                                <TableCell align="right">{formatPercent(stat.conversion_rate)}</TableCell>
                                <TableCell align="right">{formatPercent(stat.approval_rate)}</TableCell>
                                <TableCell align="right">{formatCurrency(stat.revenue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Operators Tab */}
          {activeTab === 1 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Статистика по операторам
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Оператор</TableCell>
                              <TableCell align="right">Звонков</TableCell>
                              <TableCell align="right">Дозвонов</TableCell>
                              <TableCell align="right">Заказов</TableCell>
                              <TableCell align="right">Приняли</TableCell>
                              <TableCell align="right">Подтверждение</TableCell>
                              <TableCell align="right">Время работы</TableCell>
                              <TableCell align="right">Время разговоров</TableCell>
                              <TableCell align="right">Выручка</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mockOperatorStats.map((operator) => (
                              <TableRow key={operator.operator_id}>
                                <TableCell>
                                  <Typography fontWeight="medium">
                                    {operator.operator_name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{operator.calls_made}</TableCell>
                                <TableCell align="right">
                                  {operator.calls_answered}
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {formatPercent((operator.calls_answered / operator.calls_made) * 100)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{operator.orders_processed}</TableCell>
                                <TableCell align="right">{operator.orders_approved}</TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={formatPercent(operator.approval_rate)}
                                    color={operator.approval_rate > 85 ? 'success' : operator.approval_rate > 70 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{formatTime(operator.working_time)}</TableCell>
                                <TableCell align="right">
                                  {formatTime(operator.talk_time)}
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {formatPercent((operator.talk_time / operator.working_time) * 100)} загрузка
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{formatCurrency(operator.revenue_generated)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Repurchase Statistics Tab */}
          {activeTab === 2 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Статистика по выкупаемости
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Анализ скорости доставки, динамики выкупа и работы курьерских служб
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                            <CardContent>
                              <ShippingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                1,856
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Отправлено заказов
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                            <CardContent>
                              <OrdersIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                1,542
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Выкуплено
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#fff3e0' }}>
                            <CardContent>
                              <ConversionIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                83.1%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Выкупаемость
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#fce4ec' }}>
                            <CardContent>
                              <TrendingDownIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                314
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Возвраты
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Динамика выкупаемости
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={conversionStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="shipped" fill="#2196f3" name="Отправлено" />
                          <Bar yAxisId="left" dataKey="paid" fill="#4caf50" name="Выкуплено" />
                          <Line yAxisId="right" type="monotone" dataKey="payment_rate" stroke="#ff9800" strokeWidth={3} name="% Выкупаемости" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Сроки доставки
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Средний срок доставки
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          3.2 дня
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Срок до выкупа
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          5.8 дня
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Возвраты (дни)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">
                          8.4 дня
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Анализ по курьерским службам
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Служба доставки</TableCell>
                              <TableCell align="right">Отправлено</TableCell>
                              <TableCell align="right">Выкуплено</TableCell>
                              <TableCell align="right">Выкупаемость</TableCell>
                              <TableCell align="right">Ср. срок доставки</TableCell>
                              <TableCell align="right">Возвраты</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[
                              { name: 'CDEK', sent: 856, paid: 742, rate: 86.7, delivery_days: 2.8, returns: 114 },
                              { name: 'Почта России', sent: 623, paid: 496, rate: 79.6, delivery_days: 4.2, returns: 127 },
                              { name: 'Boxberry', sent: 234, paid: 198, rate: 84.6, delivery_days: 3.1, returns: 36 },
                              { name: 'Новая почта', sent: 143, paid: 106, rate: 74.1, delivery_days: 3.8, returns: 37 }
                            ].map((service, index) => (
                              <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                  {service.name}
                                </TableCell>
                                <TableCell align="right">{service.sent.toLocaleString()}</TableCell>
                                <TableCell align="right">{service.paid.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`${service.rate}%`} 
                                    color={service.rate > 80 ? 'success' : service.rate > 75 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{service.delivery_days} дн.</TableCell>
                                <TableCell align="right">{service.returns}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Products Tab */}
          {activeTab === 3 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Статистика по товарам
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Товар</TableCell>
                              <TableCell align="right">Заказов</TableCell>
                              <TableCell align="right">Продано</TableCell>
                              <TableCell align="right">Средняя цена</TableCell>
                              <TableCell align="right">Выручка</TableCell>
                              <TableCell align="right">Прибыль</TableCell>
                              <TableCell align="right">% возврата</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mockProductStats.map((product) => (
                              <TableRow key={product.product_id}>
                                <TableCell>
                                  <Typography fontWeight="medium">
                                    {product.product_name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{product.orders_count}</TableCell>
                                <TableCell align="right">{product.quantity_sold}</TableCell>
                                <TableCell align="right">{formatCurrency(product.avg_price)}</TableCell>
                                <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                                <TableCell align="right">{formatCurrency(product.profit)}</TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={formatPercent(product.return_rate)}
                                    color={product.return_rate < 5 ? 'success' : product.return_rate < 10 ? 'warning' : 'error'}
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
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Call Statistics Tab */}
          {activeTab === 4 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <PhoneIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            1,247
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Всего звонков
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <PhoneIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            1,089
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Дозвонились
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <TimeIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            2.4м
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Средняя длительность
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <AssessmentIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold">
                            87.3%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Процент дозвона
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Детальная информация по звонкам
                      </Typography>
                      {mockCallStats.map((stat, index) => (
                        <Grid container spacing={2} key={index}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body1">
                              <strong>Пиковое время:</strong> {stat.peak_hour}
                            </Typography>
                            <Typography variant="body1">
                              <strong>Самый загруженный день:</strong> {stat.busiest_day}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body1">
                              <strong>Общее время разговоров:</strong> {formatTime(stat.total_talk_time)}
                            </Typography>
                            <Typography variant="body1">
                              <strong>Пропущено звонков:</strong> {stat.missed_calls}
                            </Typography>
                          </Grid>
                        </Grid>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Robot Calling Statistics Tab */}
          {activeTab === 5 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Статистика по робо-прозвону
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Анализ работы автоматического дозвона и предиктивного набора
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                            <CardContent>
                              <RobotIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                8,456
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Всего звонков робота
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                            <CardContent>
                              <PhoneIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                5,342
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Дозвонились
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#fff3e0' }}>
                            <CardContent>
                              <ConversionIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                63.2%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Процент дозвона
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', backgroundColor: '#fce4ec' }}>
                            <CardContent>
                              <TimeIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5" fontWeight="bold">
                                142 мин.
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Время работы
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Динамика робо-прозвона по часам
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[
                          { hour: '09:00', calls: 245, connected: 156, rate: 63.7 },
                          { hour: '10:00', calls: 298, connected: 189, rate: 63.4 },
                          { hour: '11:00', calls: 367, connected: 234, rate: 63.8 },
                          { hour: '12:00', calls: 423, connected: 275, rate: 65.0 },
                          { hour: '13:00', calls: 389, connected: 241, rate: 62.0 },
                          { hour: '14:00', calls: 456, connected: 298, rate: 65.4 },
                          { hour: '15:00', calls: 498, connected: 321, rate: 64.5 },
                          { hour: '16:00', calls: 445, connected: 278, rate: 62.5 },
                          { hour: '17:00', calls: 378, connected: 234, rate: 61.9 },
                          { hour: '18:00', calls: 267, connected: 156, rate: 58.4 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="calls" fill="#2196f3" name="Звонки" />
                          <Bar yAxisId="left" dataKey="connected" fill="#4caf50" name="Дозвонились" />
                          <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#ff9800" strokeWidth={3} name="% Дозвона" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Расходы робота
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Потрачено сегодня
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          2,847 ₽
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Стоимость дозвона
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                          0.53 ₽
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Баланс робота
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          15,642 ₽
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Эффективность
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Заказы с робо-прозвона
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          234
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          ROI робота
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          340%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Детализация робо-прозвона
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Период</TableCell>
                              <TableCell align="right">Звонки</TableCell>
                              <TableCell align="right">Дозвонились</TableCell>
                              <TableCell align="right">% Дозвона</TableCell>
                              <TableCell align="right">Распознано</TableCell>
                              <TableCell align="right">Стоимость</TableCell>
                              <TableCell align="right">Заказы</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[
                              { period: 'Сегодня', calls: 8456, connected: 5342, rate: 63.2, recognized: 4897, cost: 2847, orders: 234 },
                              { period: 'Вчера', calls: 7823, connected: 4956, rate: 63.4, recognized: 4523, cost: 2634, orders: 198 },
                              { period: 'Позавчера', calls: 6789, connected: 4234, rate: 62.4, recognized: 3856, cost: 2289, orders: 167 },
                              { period: 'За 7 дней', calls: 52340, connected: 32890, rate: 62.8, recognized: 30124, cost: 17653, orders: 1456 }
                            ].map((stat, index) => (
                              <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                  {stat.period}
                                </TableCell>
                                <TableCell align="right">{stat.calls.toLocaleString()}</TableCell>
                                <TableCell align="right">{stat.connected.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`${stat.rate}%`} 
                                    color={stat.rate > 65 ? 'success' : stat.rate > 60 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{stat.recognized.toLocaleString()}</TableCell>
                                <TableCell align="right">{stat.cost.toLocaleString()} ₽</TableCell>
                                <TableCell align="right">{stat.orders.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Webmasters Tab */}
          {activeTab === 6 && (
            <Box>
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
                              <TableCell align="right">Приняли</TableCell>
                              <TableCell align="right">Оплачено</TableCell>
                              <TableCell align="right">Конверсия</TableCell>
                              <TableCell align="right">Подтверждение</TableCell>
                              <TableCell align="right">Выручка</TableCell>
                              <TableCell align="right">Комиссия</TableCell>
                              <TableCell>Источники</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mockWebmasterStats.map((webmaster) => (
                              <TableRow key={webmaster.webmaster_id}>
                                <TableCell>
                                  <Typography fontWeight="medium">
                                    {webmaster.webmaster_name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{webmaster.clicks.toLocaleString()}</TableCell>
                                <TableCell align="right">{webmaster.orders.toLocaleString()}</TableCell>
                                <TableCell align="right">{webmaster.approved.toLocaleString()}</TableCell>
                                <TableCell align="right">{webmaster.paid.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={formatPercent(webmaster.conversion)}
                                    color={webmaster.conversion > 10 ? 'success' : webmaster.conversion > 5 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{formatPercent(webmaster.approval_rate)}</TableCell>
                                <TableCell align="right">{formatCurrency(webmaster.revenue)}</TableCell>
                                <TableCell align="right">{formatCurrency(webmaster.commission_earned)}</TableCell>
                                <TableCell>
                                  <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {webmaster.sources.map((source, idx) => (
                                      <Chip key={idx} label={source} size="small" variant="outlined" />
                                    ))}
                                  </Box>
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
            </Box>
          )}

          {/* Sales Funnel Tab */}
          {activeTab === 7 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Воронка продаж
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={conversionFunnelData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="stage" type="category" width={100} />
                          <Tooltip 
                            formatter={(value, name) => [
                              typeof value === 'number' ? value.toLocaleString() : value,
                              name === 'count' ? 'Количество' : 'Процент'
                            ]}
                          />
                          <Bar dataKey="count" fill="#2196f3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Коэффициенты конверсии
                      </Typography>
                      <Box>
                        {conversionFunnelData.map((stage, index) => (
                          <Box key={index} mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2">{stage.stage}</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatPercent(stage.rate)}
                              </Typography>
                            </Box>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: 8, 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: 4,
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: `${stage.rate}%`, 
                                  height: '100%', 
                                  backgroundColor: COLORS[index % COLORS.length],
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {stage.count.toLocaleString()} человек
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Statistics;