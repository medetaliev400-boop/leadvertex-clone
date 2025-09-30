import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Save as SaveIcon,
  Phone as PhoneIcon,
  PhoneCallback as CallbackIcon,
  Sms as SmsIcon,
  History as HistoryIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Language as WebIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as ProductIcon,
  Calculate as CalculatorIcon,
  LocalShipping as DeliveryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface OrderCardProps {
  orderId: number;
  onClose: () => void;
}

interface OrderHistory {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
}

interface DuplicateOrder {
  id: number;
  status: string;
  project: string;
  created_at: string;
  type: 'phone' | 'ip';
}

interface Script {
  id: number;
  title: string;
  content: string;
  is_expanded: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ orderId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [duplicates, setDuplicates] = useState<DuplicateOrder[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

  // Mock data
  useEffect(() => {
    const mockOrder = {
      id: orderId,
      customer_name: 'Иванов Иван Иванович',
      customer_phone: '+7 (925) 123-45-67',
      customer_email: 'ivan@example.com',
      customer_address: 'г. Москва, ул. Ленина, д. 10, кв. 5',
      customer_city: 'Москва',
      customer_index: '101000',
      status_id: 1,
      status_name: 'Принят',
      status_group: 'approved',
      total_amount: 2490,
      comment: 'Клиент просил быструю доставку',
      source: 'Лендинг #1',
      referer: 'https://yandex.ru/search',
      utm_source: 'yandex',
      utm_medium: 'cpc',
      utm_campaign: 'summer_sale',
      webmaster: 'WebMaster Pro',
      tracking_number: 'CD123456789',
      delivery_status: 'В пути',
      created_at: '2025-01-20 14:30:15',
      client_time: '2025-01-20 17:30:15',
      last_status_change: '2025-01-20 15:45:22',
      last_edit_time: '2025-01-20 16:12:08',
      timezone: -180, // GMT+3 Moscow
      products: [
        { id: 1, name: 'Смартфон X1', quantity: 1, price: 1990 },
        { id: 2, name: 'Чехол для смартфона', quantity: 1, price: 500 }
      ]
    };

    const mockDuplicates: DuplicateOrder[] = [
      { id: 12345, status: 'Отменен', project: 'Проект 1', created_at: '2025-01-18 12:00:00', type: 'phone' },
      { id: 12367, status: 'Спам', project: 'Проект 1', created_at: '2025-01-19 08:15:30', type: 'ip' }
    ];

    const mockHistory: OrderHistory[] = [
      {
        id: 1,
        timestamp: '2025-01-20 16:12:08',
        user: 'Оператор Петров',
        action: 'Изменено поле',
        field_changed: 'Адрес доставки',
        old_value: 'г. Москва, ул. Ленина, д. 10',
        new_value: 'г. Москва, ул. Ленина, д. 10, кв. 5',
        comment: 'Уточнил квартиру'
      },
      {
        id: 2,
        timestamp: '2025-01-20 15:45:22',
        user: 'Система',
        action: 'Изменен статус',
        old_value: 'Обработка',
        new_value: 'Принят',
        comment: 'Автоматическое подтверждение'
      },
      {
        id: 3,
        timestamp: '2025-01-20 14:30:15',
        user: 'Система',
        action: 'Создан заказ',
        comment: 'Заказ получен с лендинга'
      }
    ];

    const mockScripts: Script[] = [
      {
        id: 1,
        title: 'Скрипт подтверждения заказа',
        content: `Здравствуйте! Меня зовут [ИМЯ_ОПЕРАТОРА], я представляю компанию [НАЗВАНИЕ_КОМПАНИИ].

Вы оставляли заявку на [ТОВАР]? 

[ЖДЕМ ОТВЕТ]

Отлично! Давайте уточним данные для доставки:
- ФИО: [ИМЯ_КЛИЕНТА]
- Телефон: [ТЕЛЕФОН_КЛИЕНТА] 
- Адрес доставки: [АДРЕС]

Стоимость товара составляет [СУММА] рублей. 
Доставка [СПОСОБ_ДОСТАВКИ] - [СТОИМОСТЬ_ДОСТАВКИ] рублей.

Итого к оплате: [ИТОГО] рублей.

Подтверждаете заказ?`,
        is_expanded: true
      },
      {
        id: 2,
        title: 'Скрипт повторного звонка',
        content: `Добрый день! Это [ИМЯ_ОПЕРАТОРА] из [НАЗВАНИЕ_КОМПАНИИ].

Я звоню по поводу вашего заказа №[НОМЕР_ЗАКАЗА].

Вчера мы не смогли до вас дозвониться. Ваш заказ на [ТОВАР] готов к отправке.

Подтверждаете доставку по адресу [АДРЕС]?`,
        is_expanded: false
      }
    ];

    setOrder(mockOrder);
    setDuplicates(mockDuplicates);
    setHistory(mockHistory);
    setScripts(mockScripts);
  }, [orderId]);

  const getTimezoneName = (offset: number) => {
    const hours = Math.abs(offset) / 60;
    const sign = offset > 0 ? '-' : '+';
    return `GMT${sign}${hours}`;
  };

  const formatDateTime = (dateStr: string, clientTimezone?: number) => {
    const date = new Date(dateStr);
    if (clientTimezone) {
      date.setMinutes(date.getMinutes() + clientTimezone);
    }
    return date.toLocaleString('ru-RU');
  };

  if (!order) {
    return <div>Загрузка...</div>;
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Заказ #{order.id}
        </Typography>
        <Button onClick={onClose} variant="outlined">
          Закрыть
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Main Order Data */}
        <Grid item xs={12} md={8}>
          {/* Call Mode Buttons */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Кнопки режима прозвона
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button 
                  variant="contained" 
                  color="success" 
                  startIcon={<CheckIcon />}
                >
                  Подтвердить
                </Button>
                <Button 
                  variant="contained" 
                  color="warning" 
                  startIcon={<CallbackIcon />}
                >
                  Перезвонить
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<CancelIcon />}
                >
                  Отменить
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<PhoneIcon />}
                >
                  Дозвониться
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Duplicates Information */}
          {duplicates.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  Обнаружены дубли
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Найдены заказы с тем же номером телефона или IP-адресом
                </Typography>
                <List dense>
                  {duplicates.map((duplicate) => (
                    <ListItem 
                      key={duplicate.id}
                      sx={{ 
                        border: 1, 
                        borderColor: 'warning.light', 
                        borderRadius: 1, 
                        mb: 1,
                        backgroundColor: 'warning.lighter'
                      }}
                    >
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Заказ #${duplicate.id} - ${duplicate.status}`}
                        secondary={`${duplicate.project} • ${duplicate.created_at} • Дубль по ${duplicate.type === 'phone' ? 'телефону' : 'IP'}`}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(`/orders/${duplicate.id}`, '_blank')}
                      >
                        <EditIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Data Standardization */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Стандартизация данных
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Адрес (стандартизованный)"
                    value={order.customer_address}
                    InputProps={{
                      endAdornment: (
                        <Button size="small" variant="outlined">
                          Проверить
                        </Button>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Почтовый индекс"
                    value={order.customer_index}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Main Order Fields */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Данные заказа
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ФИО клиента"
                    value={order.customer_name}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Телефон"
                    value={order.customer_phone}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={order.customer_email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Город"
                    value={order.customer_city}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Адрес доставки"
                    value={order.customer_address}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Комментарий"
                    value={order.comment}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button variant="contained" startIcon={<SaveIcon />}>
                  Сохранить изменения
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Product Calculator */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Калькулятор товаров
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Товар</TableCell>
                      <TableCell align="right">Количество</TableCell>
                      <TableCell align="right">Цена</TableCell>
                      <TableCell align="right">Сумма</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={product.quantity}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={product.price}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {(product.quantity * product.price).toLocaleString()} ₽
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error">
                            <CancelIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Button variant="outlined" startIcon={<ProductIcon />}>
                  Добавить товар
                </Button>
                <Typography variant="h6" fontWeight="bold">
                  Итого: {order.total_amount.toLocaleString()} ₽
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* SMS Sending */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Отправка SMS
              </Typography>
              <Box display="flex" gap={2}>
                <Button 
                  variant="contained" 
                  startIcon={<SmsIcon />}
                  onClick={() => setSmsDialogOpen(true)}
                >
                  Отправить SMS
                </Button>
                <Button variant="outlined">
                  Голосовое SMS
                </Button>
                <Button variant="outlined">
                  Шаблоны
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                История заказа
              </Typography>
              <List>
                {history.map((entry) => (
                  <ListItem key={entry.id} divider>
                    <ListItemIcon>
                      <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.action}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {entry.timestamp} • {entry.user}
                          </Typography>
                          {entry.field_changed && (
                            <Typography variant="body2">
                              <strong>{entry.field_changed}:</strong> {entry.old_value} → {entry.new_value}
                            </Typography>
                          )}
                          {entry.comment && (
                            <Typography variant="body2" fontStyle="italic">
                              {entry.comment}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Technical Info & Scripts */}
        <Grid item xs={12} md={4}>
          {/* Technical Order Information */}
          <Card sx={{ mb: 3, backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Техническая информация
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Время получения заказа
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatDateTime(order.created_at)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Время клиента
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatDateTime(order.client_time)} ({getTimezoneName(order.timezone)})
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Последнее изменение статуса
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(order.last_status_change)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Последнее редактирование
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(order.last_edit_time)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Вебмастер
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {order.webmaster}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Источник заказа
                </Typography>
                <Typography variant="body1">
                  {order.source}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Referer
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {order.referer}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  UTM метки
                </Typography>
                <Box>
                  <Chip label={`Source: ${order.utm_source}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  <Chip label={`Medium: ${order.utm_medium}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  <Chip label={`Campaign: ${order.utm_campaign}`} size="small" sx={{ mb: 0.5 }} />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Трек-номер
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" fontWeight="bold">
                    {order.tracking_number}
                  </Typography>
                  <IconButton size="small" onClick={() => navigator.clipboard.writeText(order.tracking_number)}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Статус доставки
                </Typography>
                <Chip 
                  label={order.delivery_status} 
                  color="warning"
                  icon={<DeliveryIcon />}
                />
              </Box>

              {/* Timezone Adjustment (only for entrepreneur) */}
              <Box mt={3}>
                <TextField
                  fullWidth
                  label="Часовой пояс (мин. от UTC)"
                  type="number"
                  value={order.timezone}
                  size="small"
                  helperText="Только для предпринимателя"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Delivery Service Buttons */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Службы доставки
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="outlined" 
                  startIcon={<DeliveryIcon />}
                  onClick={() => setDeliveryDialogOpen(true)}
                >
                  CDEK
                </Button>
                <Button variant="outlined" startIcon={<DeliveryIcon />}>
                  Почта России
                </Button>
                <Button variant="outlined" startIcon={<DeliveryIcon />}>
                  BoxBerry
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Scripts for Operators */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Скрипты для операторов
              </Typography>
              {scripts.map((script) => (
                <Accordion key={script.id} defaultExpanded={script.is_expanded}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {script.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-line',
                        backgroundColor: '#f5f5f5',
                        p: 2,
                        borderRadius: 1
                      }}
                    >
                      {script.content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SMS Dialog */}
      <Dialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отправить SMS</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Номер телефона"
            value={order.customer_phone}
            disabled
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Шаблон SMS</InputLabel>
            <Select defaultValue="">
              <MenuItem value="confirm">Подтверждение заказа</MenuItem>
              <MenuItem value="shipping">Уведомление об отправке</MenuItem>
              <MenuItem value="delivery">Уведомление о доставке</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Текст сообщения"
            multiline
            rows={4}
            defaultValue={`Здравствуйте! Ваш заказ №${order.id} на сумму ${order.total_amount} руб. подтвержден. Ожидайте доставку.`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialogOpen(false)}>
            Отмена
          </Button>
          <Button variant="contained">
            Отправить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Service Dialog */}
      <Dialog open={deliveryDialogOpen} onClose={() => setDeliveryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>CDEK - Расчет доставки</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Город отправления"
                defaultValue="Москва"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Город получения"
                defaultValue={order.customer_city}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Вес (кг)"
                type="number"
                defaultValue="1"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                  Стоимость доставки
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  320 ₽
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Срок доставки: 2-3 дня
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialogOpen(false)}>
            Закрыть
          </Button>
          <Button variant="contained">
            Создать накладную
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderCard;