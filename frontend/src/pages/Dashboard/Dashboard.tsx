import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Project } from '../../services/api';

interface DashboardStats {
  totalOrders: number;
  newOrdersToday: number;
  totalRevenue: number;
  conversionRate: number;
  topProducts: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip
              icon={<TrendingUpIcon />}
              label={trend}
              size="small"
              color="success"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data for demonstration
  const mockStats: DashboardStats = {
    totalOrders: 1247,
    newOrdersToday: 23,
    totalRevenue: 485600,
    conversionRate: 12.4,
    topProducts: [
      { name: 'Продукт А', orders: 156, revenue: 78000 },
      { name: 'Продукт Б', orders: 134, revenue: 67000 },
      { name: 'Продукт В', orders: 98, revenue: 49000 },
    ],
    ordersByStatus: [
      { status: 'Обработка', count: 45, color: '#2196f3' },
      { status: 'Принят', count: 128, color: '#4caf50' },
      { status: 'Отправлен', count: 89, color: '#ff9800' },
      { status: 'Доставлен', count: 234, color: '#9c27b0' },
    ],
    dailyStats: [
      { date: '2025-01-20', orders: 15, revenue: 7500 },
      { date: '2025-01-21', orders: 22, revenue: 11000 },
      { date: '2025-01-22', orders: 18, revenue: 9000 },
      { date: '2025-01-23', orders: 25, revenue: 12500 },
      { date: '2025-01-24', orders: 19, revenue: 9500 },
      { date: '2025-01-25', orders: 28, revenue: 14000 },
      { date: '2025-01-26', orders: 23, revenue: 11500 },
    ],
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadDashboardStats();
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

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      // In real app: const response = await apiService.getDashboardStats(selectedProject);
      setTimeout(() => {
        setStats(mockStats);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];

  if (!projects.length && !loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Дашборд
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
          Дашборд
        </Typography>
        
        {projects.length > 0 && (
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
        )}
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
      ) : stats ? (
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Всего заказов"
              value={stats.totalOrders.toLocaleString()}
              subtitle="За все время"
              icon={<OrdersIcon />}
              color="#2196f3"
              trend="+12% за месяц"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Заказов сегодня"
              value={stats.newOrdersToday}
              subtitle="Новые заказы"
              icon={<CustomersIcon />}
              color="#4caf50"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Общая выручка"
              value={formatCurrency(stats.totalRevenue)}
              subtitle="За все время"
              icon={<RevenueIcon />}
              color="#ff9800"
              trend="+8% за месяц"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Конверсия"
              value={`${stats.conversionRate}%`}
              subtitle="Заказы к посетителям"
              icon={<TrendingUpIcon />}
              color="#9c27b0"
              trend="+2.1% за неделю"
            />
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Динамика заказов и выручки
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="orders" orientation="left" />
                  <YAxis yAxisId="revenue" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'orders' ? value : formatCurrency(Number(value)),
                      name === 'orders' ? 'Заказы' : 'Выручка'
                    ]}
                  />
                  <Line 
                    yAxisId="orders"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#2196f3" 
                    strokeWidth={2}
                    dot={{ fill: '#2196f3' }}
                  />
                  <Line 
                    yAxisId="revenue"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4caf50" 
                    strokeWidth={2}
                    dot={{ fill: '#4caf50' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Заказы по статусам
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Топ товары
              </Typography>
              <Box>
                {stats.topProducts.map((product, index) => (
                  <Box
                    key={product.name}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    py={1}
                    borderBottom={index < stats.topProducts.length - 1 ? 1 : 0}
                    borderColor="divider"
                  >
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.orders} заказов
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(product.revenue)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Быстрые действия
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <OrdersIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">
                      Создать заказ
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ProductsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">
                      Добавить товар
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default Dashboard;