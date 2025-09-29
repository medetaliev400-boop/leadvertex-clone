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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Product, Project, Category } from '../../services/api';

interface ProductFilters {
  search: string;
  category_id: number | null;
  min_price: number | null;
  max_price: number | null;
  in_stock: boolean | null;
}

interface ProductFormData {
  name: string;
  description: string;
  alias: string;
  category_id: number | null;
  unit: string;
  weight: number;
  purchase_price: number;
  prices: Array<{ quantity: number; price: number }>;
  stock_quantity: number;
  track_stock: boolean;
  is_active: boolean;
}

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: number | null;
}

const Products: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tab management
  const [activeTab, setActiveTab] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 25;
  
  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category_id: null,
    min_price: null,
    max_price: null,
    in_stock: null,
  });
  
  // Product dialog states
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    alias: '',
    category_id: null,
    unit: 'шт.',
    weight: 0,
    purchase_price: 0,
    prices: [{ quantity: 1, price: 0 }],
    stock_quantity: 0,
    track_stock: true,
    is_active: true,
  });

  // Category dialog states
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: null,
  });

  // Bulk operations
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkOperationOpen, setBulkOperationOpen] = useState(false);

  // Mock data for demonstration
  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Смартфон iPhone 15 Pro',
      description: 'Новейший смартфон Apple с передовыми технологиями',
      alias: 'iphone-15-pro',
      category_id: 1,
      category_name: 'Электроника',
      unit: 'шт.',
      weight: 200,
      purchase_price: 80000,
      prices: [
        { quantity: 1, price: 120000 },
        { quantity: 2, price: 230000 },
        { quantity: 3, price: 330000 }
      ],
      stock_quantity: 150,
      track_stock: true,
      is_active: true,
      project_enabled: true,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-26T15:30:00Z'
    },
    {
      id: 2,
      name: 'Наушники AirPods Pro 2',
      description: 'Беспроводные наушники с активным шумоподавлением',
      alias: 'airpods-pro-2',
      category_id: 1,
      category_name: 'Электроника',
      unit: 'шт.',
      weight: 60,
      purchase_price: 15000,
      prices: [
        { quantity: 1, price: 25000 },
        { quantity: 2, price: 48000 }
      ],
      stock_quantity: 85,
      track_stock: true,
      is_active: true,
      project_enabled: false,
      created_at: '2025-01-20T14:00:00Z',
      updated_at: '2025-01-25T09:15:00Z'
    },
    {
      id: 3,
      name: 'Крем для лица Anti-Age',
      description: 'Антивозрастной крем с пептидами и гиалуроновой кислотой',
      alias: 'face-cream-anti-age',
      category_id: 2,
      category_name: 'Косметика',
      unit: 'шт.',
      weight: 50,
      purchase_price: 800,
      prices: [
        { quantity: 1, price: 2500 },
        { quantity: 2, price: 4500 },
        { quantity: 3, price: 6000 }
      ],
      stock_quantity: 0,
      track_stock: true,
      is_active: true,
      project_enabled: true,
      created_at: '2025-01-10T08:00:00Z',
      updated_at: '2025-01-26T12:45:00Z'
    }
  ];

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Электроника',
      description: 'Смартфоны, планшеты, аксессуары',
      parent_id: null,
      products_count: 45,
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Косметика',
      description: 'Уход за кожей, декоративная косметика',
      parent_id: null,
      products_count: 28,
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: 'Одежда',
      description: 'Мужская и женская одежда',
      parent_id: null,
      products_count: 67,
      created_at: '2025-01-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProducts();
      loadCategories();
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
      console.error('Error loading projects:', error);
      setError('Не удалось загрузить проекты');
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      // In real app: const response = await apiService.getProducts(selectedProject, { page, ...filters });
      setTimeout(() => {
        setProducts(mockProducts);
        setTotalProducts(mockProducts.length);
        setTotalPages(Math.ceil(mockProducts.length / pageSize));
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Не удалось загрузить товары');
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // For demo purposes, use mock data
      // In real app: const response = await apiService.getCategories(selectedProject);
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
      alias: '',
      category_id: null,
      unit: 'шт.',
      weight: 0,
      purchase_price: 0,
      prices: [{ quantity: 1, price: 0 }],
      stock_quantity: 0,
      track_stock: true,
      is_active: true,
    });
    setOpenProductDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      alias: product.alias,
      category_id: product.category_id,
      unit: product.unit,
      weight: product.weight,
      purchase_price: product.purchase_price,
      prices: product.prices,
      stock_quantity: product.stock_quantity,
      track_stock: product.track_stock,
      is_active: product.is_active,
    });
    setOpenProductDialog(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        // await apiService.updateProduct(editingProduct.id, productFormData);
        console.log('Updating product:', productFormData);
      } else {
        // await apiService.createProduct(selectedProject!, productFormData);
        console.log('Creating product:', productFormData);
      }
      setOpenProductDialog(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Не удалось сохранить товар');
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      parent_id: null,
    });
    setOpenCategoryDialog(true);
  };

  const addPriceLevel = () => {
    setProductFormData({
      ...productFormData,
      prices: [...productFormData.prices, { quantity: 1, price: 0 }]
    });
  };

  const removePriceLevel = (index: number) => {
    const newPrices = productFormData.prices.filter((_, i) => i !== index);
    setProductFormData({
      ...productFormData,
      prices: newPrices
    });
  };

  const updatePriceLevel = (index: number, field: 'quantity' | 'price', value: number) => {
    const newPrices = [...productFormData.prices];
    newPrices[index][field] = value;
    setProductFormData({
      ...productFormData,
      prices: newPrices
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const productColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Название', width: 250 },
    { field: 'category_name', headerName: 'Категория', width: 150 },
    { 
      field: 'price_from', 
      headerName: 'Цена от', 
      width: 120,
      renderCell: (params) => formatCurrency(params.row.prices[0]?.price || 0)
    },
    { field: 'stock_quantity', headerName: 'На складе', width: 100 },
    { field: 'unit', headerName: 'Ед. изм.', width: 80 },
    {
      field: 'is_active',
      headerName: 'Активен',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Да' : 'Нет'} 
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'project_enabled',
      headerName: 'В проекте',
      width: 100,
      renderCell: (params) => (
        <Switch 
          checked={params.value}
          size="small"
          onChange={(e) => {
            // Handle project enable/disable
            console.log('Toggle project for product:', params.row.id);
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleEditProduct(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => console.log('View product:', params.row.id)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => console.log('Delete product:', params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  if (!projects.length && !loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Товары (Склад)
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
          Склад
        </Typography>
        
        {projects.length > 0 && (
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
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Список товаров" />
          <Tab label="Категории" />
          <Tab label="Массовые операции" />
        </Tabs>
      </Box>

      {/* Products Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Filters and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Поиск товаров..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Категория</InputLabel>
                    <Select
                      value={filters.category_id || ''}
                      label="Категория"
                      onChange={(e) => setFilters({ ...filters, category_id: Number(e.target.value) || null })}
                    >
                      <MenuItem value="">Все категории</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Наличие</InputLabel>
                    <Select
                      value={filters.in_stock === null ? '' : filters.in_stock.toString()}
                      label="Наличие"
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        in_stock: e.target.value === '' ? null : e.target.value === 'true'
                      })}
                    >
                      <MenuItem value="">Все товары</MenuItem>
                      <MenuItem value="true">В наличии</MenuItem>
                      <MenuItem value="false">Нет в наличии</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="Цена от"
                    value={filters.min_price || ''}
                    onChange={(e) => setFilters({ ...filters, min_price: Number(e.target.value) || null })}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="Цена до"
                    value={filters.max_price || ''}
                    onChange={(e) => setFilters({ ...filters, max_price: Number(e.target.value) || null })}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFilters({
                      search: '',
                      category_id: null,
                      min_price: null,
                      max_price: null,
                      in_stock: null,
                    })}
                  >
                    Сбросить
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateProduct}
              >
                Добавить товар
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => console.log('Import products')}
              >
                Импорт
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => console.log('Export products')}
              >
                Экспорт
              </Button>
              {selectedProducts.length > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setBulkOperationOpen(true)}
                >
                  Операции ({selectedProducts.length})
                </Button>
              )}
            </CardActions>
          </Card>

          {/* Products Table */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={products}
              columns={productColumns}
              loading={loading}
              paginationMode="server"
              page={page - 1}
              pageSize={pageSize}
              rowCount={totalProducts}
              onPageChange={(newPage) => setPage(newPage + 1)}
              checkboxSelection
              onSelectionModelChange={(newSelection) => {
                setSelectedProducts(newSelection as number[]);
              }}
              disableSelectionOnClick
            />
          </Paper>
        </Box>
      )}

      {/* Categories Tab */}
      {activeTab === 1 && (
        <Box>
          <Card>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<CategoryIcon />}
                onClick={handleCreateCategory}
              >
                Добавить категорию
              </Button>
            </CardActions>
            <CardContent>
              <Grid container spacing={2}>
                {categories.map((category) => (
                  <Grid item xs={12} md={6} lg={4} key={category.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {category.description}
                        </Typography>
                        <Badge badgeContent={category.products_count} color="primary">
                          <Chip label="товаров" size="small" />
                        </Badge>
                      </CardContent>
                      <CardActions>
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
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Bulk Operations Tab */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Массовое добавление из Excel
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Загрузите Excel файл с товарами для массового добавления
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Выбрать Excel файл
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Массовое редактирование
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Выберите товары в списке для массового изменения параметров
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={selectedProducts.length === 0}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Редактировать выбранные ({selectedProducts.length})
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Product Dialog */}
      <Dialog 
        open={openProductDialog} 
        onClose={() => setOpenProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Название товара*"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Алиас"
                value={productFormData.alias}
                onChange={(e) => setProductFormData({ ...productFormData, alias: e.target.value })}
                helperText="Для корректной работы лендингов"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Описание"
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Категория</InputLabel>
                <Select
                  value={productFormData.category_id || ''}
                  label="Категория"
                  onChange={(e) => setProductFormData({ ...productFormData, category_id: Number(e.target.value) || null })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Единица измерения"
                value={productFormData.unit}
                onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Вес (грамм)"
                value={productFormData.weight}
                onChange={(e) => setProductFormData({ ...productFormData, weight: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Закупочная цена"
                value={productFormData.purchase_price}
                onChange={(e) => setProductFormData({ ...productFormData, purchase_price: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="На складе"
                value={productFormData.stock_quantity}
                onChange={(e) => setProductFormData({ ...productFormData, stock_quantity: Number(e.target.value) })}
              />
            </Grid>
            
            {/* Price Levels */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Цены
              </Typography>
              {productFormData.prices.map((price, index) => (
                <Box key={index} display="flex" gap={2} mb={2} alignItems="center">
                  <TextField
                    type="number"
                    label="Количество"
                    value={price.quantity}
                    onChange={(e) => updatePriceLevel(index, 'quantity', Number(e.target.value))}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    type="number"
                    label="Цена"
                    value={price.price}
                    onChange={(e) => updatePriceLevel(index, 'price', Number(e.target.value))}
                    sx={{ width: 150 }}
                  />
                  {productFormData.prices.length > 1 && (
                    <IconButton onClick={() => removePriceLevel(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button onClick={addPriceLevel} variant="outlined" size="small">
                Добавить уровень цены
              </Button>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={productFormData.track_stock}
                    onChange={(e) => setProductFormData({ ...productFormData, track_stock: e.target.checked })}
                  />
                }
                label="Вести учет остатков"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={productFormData.is_active}
                    onChange={(e) => setProductFormData({ ...productFormData, is_active: e.target.checked })}
                  />
                }
                label="Активный товар"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSaveProduct}
            variant="contained"
            disabled={!productFormData.name}
          >
            {editingProduct ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog 
        open={openCategoryDialog} 
        onClose={() => setOpenCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название категории*"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Описание"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Родительская категория</InputLabel>
                <Select
                  value={categoryFormData.parent_id || ''}
                  label="Родительская категория"
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, parent_id: Number(e.target.value) || null })}
                >
                  <MenuItem value="">Корневая категория</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>
            Отмена
          </Button>
          <Button 
            variant="contained"
            disabled={!categoryFormData.name}
          >
            {editingCategory ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;