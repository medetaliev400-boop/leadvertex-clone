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
  Pagination,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { apiService, Order, Project, PaginatedResponse } from '../../services/api';

interface OrderFilters {
  search: string;
  status_id: number | null;
  date_from: Date | null;
  date_to: Date | null;
}

interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  comment: string;
}

const Orders: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 25;
  
  // Filters
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status_id: null,
    date_from: null,
    date_to: null,
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    total_amount: 0,
    comment: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadOrders();
      loadStatuses();
    }
  }, [selectedProject, page, filters]);

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
      setError('Не удалось загрузить проекты');
    }
  };

  const loadOrders = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const params = {
        project_id: selectedProject,
        page,
        limit: pageSize,
        ...filters,
        date_from: filters.date_from?.toISOString(),
        date_to: filters.date_to?.toISOString(),
      };

      const response = await apiService.getOrders(params);
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Order>;
        setOrders(data.items);
        setTotalPages(data.pages);
        setTotalOrders(data.total);
      }
    } catch (error) {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const loadStatuses = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await apiService.getOrderStatuses(selectedProject);
      if (response.success && response.data) {
        setStatuses(response.data);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      total_amount: 0,
      comment: '',
    });
    setOpenDialog(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || '',
      total_amount: order.total_amount,
      comment: '',
    });
    setOpenDialog(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedProject || !formData.customer_name || !formData.customer_phone) {
      setError('Заполните обязательные поля');
      return;
    }

    try {
      let response;
      
      if (editingOrder) {
        response = await apiService.updateOrder(editingOrder.id, formData);
      } else {
        response = await apiService.createOrder(selectedProject, formData);
      }

      if (response.success) {
        setOpenDialog(false);
        loadOrders();
        setError('');
      } else {
        setError(response.error || 'Ошибка при сохранении заказа');
      }
    } catch (error) {
      setError('Ошибка при сохранении заказа');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }

    try {
      const response = await apiService.deleteOrder(orderId);
      if (response.success) {
        loadOrders();
      } else {
        setError(response.error || 'Ошибка при удалении заказа');
      }
    } catch (error) {
      setError('Ошибка при удалении заказа');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (group: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      processing: 'primary',
      accepted: 'success',
      shipped: 'info',
      paid: 'success',
      canceled: 'error',
      return: 'warning',
      spam: 'error',
    };
    return colors[group] || 'default';
  };

  if (!projects.length) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Заказы
        </Typography>
        <Alert severity="info">
          У вас пока нет проектов. Создайте проект для начала работы с заказами.
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Заказы
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOrder}
          >
            Создать заказ
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Project selector and filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
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
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Поиск"
                  placeholder="Имя, телефон, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Статус</InputLabel>
                  <Select
                    value={filters.status_id || ''}
                    label="Статус"
                    onChange={(e) => setFilters({ ...filters, status_id: Number(e.target.value) || null })}
                  >
                    <MenuItem value="">Все статусы</MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <DatePicker
                  label="Дата от"
                  value={filters.date_from}
                  onChange={(date) => setFilters({ ...filters, date_from: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <DatePicker
                  label="Дата до"
                  value={filters.date_to}
                  onChange={(date) => setFilters({ ...filters, date_to: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={1}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setFilters({ search: '', status_id: null, date_from: null, date_to: null })}
                >
                  Сброс
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Orders list */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {orders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={1}>
                          <Typography variant="h6" color="primary">
                            #{order.id}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {order.customer_name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {order.customer_phone}
                            </Typography>
                          </Box>
                          {order.customer_email && (
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {order.customer_email}
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={12} md={2}>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(order.total_amount)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={2}>
                          {order.status && (
                            <Chip
                              label={order.status.name}
                              color={getStatusColor(order.status.group)}
                              variant="outlined"
                            />
                          )}
                        </Grid>

                        <Grid item xs={12} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(order.created_at)}
                          </Typography>
                          {order.operator && (
                            <Typography variant="caption" display="block">
                              {order.operator.first_name} {order.operator.last_name}
                            </Typography>
                          )}
                        </Grid>

                        <Grid item xs={12} md={2}>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditOrder(order)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}

            {/* Statistics */}
            <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Показано: {orders.length} из {totalOrders} заказов
              </Typography>
            </Box>
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingOrder ? 'Редактировать заказ' : 'Создать заказ'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Имя клиента *"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Телефон *"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Сумма заказа"
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Комментарий"
                  multiline
                  rows={3}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveOrder} variant="contained">
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Orders;