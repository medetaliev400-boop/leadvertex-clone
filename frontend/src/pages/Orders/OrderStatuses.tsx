import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Sms as SmsIcon,
  Inventory as InventoryIcon,
  CallMade as CallIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Order Status Groups based on LeadVertex knowledge base
export const STATUS_GROUPS = {
  processing: { name: 'Обработка', color: '#9e9e9e', description: 'Для всех новых заказов' },
  approved: { name: 'Принят', color: '#4caf50', description: 'Для подтверждения, т.е. принятых заказов' },
  shipped: { name: 'Отправлен', color: '#2196f3', description: 'Для заказов, отправленных через почту/курьеры' },
  paid: { name: 'Оплачен', color: '#ff9800', description: 'Обычно финальная стадия, для оплаченных заказов' },
  returned: { name: 'Возврат', color: '#ff5722', description: 'Отправленные заказы, не выкупленные клиентом' },
  cancelled: { name: 'Отменен', color: '#f44336', description: 'Заказы, отмененные из-за недозвона или отказа клиента' },
  spam: { name: 'Ошибка/Спам/Дубль', color: '#795548', description: 'Некачественные заказы, спам, дубли' }
};

interface OrderStatus {
  id: number;
  name: string;
  group: keyof typeof STATUS_GROUPS;
  sort_order: number;
  hide_from_webmaster: boolean;
  sms_template_id?: number;
  timeout_hours?: number;
  timeout_target_status_id?: number;
  warehouse_action?: 'reserve' | 'nullify' | 'none';
  call_mode_type?: 'new' | 'reconfirm' | 'until_redemption' | 'custom_1' | 'custom_2' | 'custom_3';
  always_send_sms: boolean;
  container_id?: number;
  post_keywords?: string;
  is_active: boolean;
}

interface StatusContainer {
  id: number;
  name: string;
  description?: string;
  statuses_count: number;
}

const OrderStatuses: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [containers, setContainers] = useState<StatusContainer[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [containerDialogOpen, setContainerDialogOpen] = useState(false);

  // Mock data
  useEffect(() => {
    const mockStatuses: OrderStatus[] = [
      {
        id: 0,
        name: 'Обработка',
        group: 'processing',
        sort_order: 0,
        hide_from_webmaster: false,
        warehouse_action: 'none',
        always_send_sms: false,
        is_active: true
      },
      {
        id: 1,
        name: 'Принят',
        group: 'approved',
        sort_order: 1,
        hide_from_webmaster: false,
        warehouse_action: 'reserve',
        call_mode_type: 'new',
        always_send_sms: true,
        is_active: true
      },
      {
        id: 2,
        name: 'Отправлен Почтой России',
        group: 'shipped',
        sort_order: 2,
        hide_from_webmaster: false,
        warehouse_action: 'none',
        timeout_hours: 168, // 7 days
        sms_template_id: 1,
        container_id: 1,
        always_send_sms: false,
        is_active: true
      },
      {
        id: 3,
        name: 'Отправлен CDEK',
        group: 'shipped',
        sort_order: 3,
        hide_from_webmaster: false,
        warehouse_action: 'none',
        timeout_hours: 72, // 3 days
        container_id: 1,
        always_send_sms: false,
        is_active: true
      },
      {
        id: 4,
        name: 'Выкуплен',
        group: 'paid',
        sort_order: 4,
        hide_from_webmaster: false,
        warehouse_action: 'none',
        always_send_sms: true,
        is_active: true
      },
      {
        id: 5,
        name: 'Возврат',
        group: 'returned',
        sort_order: 5,
        hide_from_webmaster: false,
        warehouse_action: 'nullify',
        always_send_sms: false,
        is_active: true
      },
      {
        id: 6,
        name: 'Отменен клиентом',
        group: 'cancelled',
        sort_order: 6,
        hide_from_webmaster: false,
        warehouse_action: 'nullify',
        always_send_sms: false,
        is_active: true
      },
      {
        id: 7,
        name: 'Недозвон',
        group: 'cancelled',
        sort_order: 7,
        hide_from_webmaster: false,
        warehouse_action: 'nullify',
        call_mode_type: 'reconfirm',
        always_send_sms: false,
        is_active: true
      },
      {
        id: 8,
        name: 'Спам',
        group: 'spam',
        sort_order: 8,
        hide_from_webmaster: true,
        warehouse_action: 'none',
        always_send_sms: false,
        is_active: true
      }
    ];

    const mockContainers: StatusContainer[] = [
      { id: 1, name: 'Отправленные заказы', description: 'Объединение всех видов отправки', statuses_count: 2 },
      { id: 2, name: 'Отмененные заказы', description: 'Различные виды отмен', statuses_count: 2 }
    ];

    setStatuses(mockStatuses);
    setContainers(mockContainers);
  }, []);

  const getStatusGroupInfo = (group: keyof typeof STATUS_GROUPS) => {
    return STATUS_GROUPS[group] || STATUS_GROUPS.processing;
  };

  const handleEditStatus = (status: OrderStatus) => {
    setEditingStatus(status);
    setEditDialogOpen(true);
  };

  const handleMoveStatus = (statusId: number, direction: 'up' | 'down') => {
    const currentIndex = statuses.findIndex(s => s.id === statusId);
    if (currentIndex === -1) return;

    const newStatuses = [...statuses];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < newStatuses.length) {
      // Swap sort orders
      const temp = newStatuses[currentIndex].sort_order;
      newStatuses[currentIndex].sort_order = newStatuses[targetIndex].sort_order;
      newStatuses[targetIndex].sort_order = temp;

      // Swap positions in array
      [newStatuses[currentIndex], newStatuses[targetIndex]] = [newStatuses[targetIndex], newStatuses[currentIndex]];
      
      setStatuses(newStatuses);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Статусы заказов
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setContainerDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Контейнеры
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Добавить статус
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Status Groups Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(STATUS_GROUPS).map(([key, group]) => {
          const groupStatuses = statuses.filter(s => s.group === key);
          return (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: group.color,
                        borderRadius: '50%',
                        mr: 1
                      }}
                    />
                    <Typography variant="h6" fontWeight="bold">
                      {group.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {group.description}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {groupStatuses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    статусов
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Управление статусами
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Настройка статусов заказов, их групп, таймаутов, SMS-уведомлений и действий со складом
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Группа</TableCell>
                    <TableCell>Сортировка</TableCell>
                    <TableCell>SMS</TableCell>
                    <TableCell>Таймаут</TableCell>
                    <TableCell>Склад</TableCell>
                    <TableCell>Режим прозвона</TableCell>
                    <TableCell>Контейнер</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statuses.map((status) => {
                    const groupInfo = getStatusGroupInfo(status.group);
                    const container = containers.find(c => c.id === status.container_id);
                    
                    return (
                      <TableRow key={status.id}>
                        <TableCell>
                          <Chip
                            label={status.id}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                backgroundColor: groupInfo.color,
                                borderRadius: '50%',
                                mr: 1
                              }}
                            />
                            <Typography fontWeight={status.id === 0 ? 'bold' : 'normal'}>
                              {status.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={groupInfo.name}
                            size="small"
                            sx={{ 
                              backgroundColor: groupInfo.color,
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {status.sort_order}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveStatus(status.id, 'up')}
                              disabled={status.sort_order === 0}
                            >
                              <ArrowUpIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveStatus(status.id, 'down')}
                              disabled={status.sort_order === statuses.length - 1}
                            >
                              <ArrowDownIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {status.sms_template_id ? (
                            <Badge badgeContent={status.always_send_sms ? "∞" : "1"} color="primary">
                              <SmsIcon color="success" />
                            </Badge>
                          ) : (
                            <SmsIcon color="disabled" />
                          )}
                        </TableCell>
                        <TableCell>
                          {status.timeout_hours ? (
                            <Box display="flex" alignItems="center">
                              <ScheduleIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">
                                {status.timeout_hours}ч
                              </Typography>
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {status.warehouse_action && status.warehouse_action !== 'none' ? (
                            <Chip
                              label={status.warehouse_action === 'reserve' ? 'Резерв' : 'Обнулить'}
                              size="small"
                              color={status.warehouse_action === 'reserve' ? 'warning' : 'error'}
                              icon={<InventoryIcon />}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {status.call_mode_type ? (
                            <Chip
                              label={
                                status.call_mode_type === 'new' ? 'Новые' :
                                status.call_mode_type === 'reconfirm' ? 'Повтор' :
                                status.call_mode_type === 'until_redemption' ? 'До выкупа' :
                                `Произв.${status.call_mode_type.slice(-1)}`
                              }
                              size="small"
                              color="info"
                              icon={<CallIcon />}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {container ? (
                            <Chip
                              label={container.name}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditStatus(status)}
                            disabled={status.id === 0} // Cannot edit "Обработка" status
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={status.id === 0} // Cannot delete "Обработка" status
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Settings Accordion */}
      <Box mt={4}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TimelineIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Ключевые особенности системы статусов</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Группы статусов
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Каждый статус принадлежит к определенной группе, которая определяет стадию обработки заказа.
                  Группы влияют на аналитику и выплаты вебмастерам.
                </Typography>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Действия со складом
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • <strong>Зарезервировать</strong> - списать со склада (для статусов "Принят", "Отправлен", "Оплачен")<br/>
                  • <strong>Обнулить</strong> - вернуть на склад (для статуса "Возврат")
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Таймауты статусов
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Автоматическое перемещение заказа из одного статуса в другой через заданное время.
                  Минимум 1 час. Полезно для очистки старых заказов.
                </Typography>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  SMS уведомления
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Автоматическая отправка SMS при попадании заказа в статус.
                  Голосовые SMS отправляются с 9:00 до 21:00 по времени клиента.
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStatus ? `Редактировать статус "${editingStatus.name}"` : 'Добавить новый статус'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Название статуса"
                defaultValue={editingStatus?.name || ''}
                disabled={editingStatus?.id === 0}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Группа статуса</InputLabel>
                <Select defaultValue={editingStatus?.group || 'processing'}>
                  {Object.entries(STATUS_GROUPS).map(([key, group]) => (
                    <MenuItem key={key} value={key}>
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: group.color,
                            borderRadius: '50%',
                            mr: 1
                          }}
                        />
                        {group.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Таймаут (часы)"
                type="number"
                defaultValue={editingStatus?.timeout_hours || 0}
                helperText="0 = без таймаута, минимум 1 час"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Действие со складом</InputLabel>
                <Select defaultValue={editingStatus?.warehouse_action || 'none'}>
                  <MenuItem value="none">Не изменять</MenuItem>
                  <MenuItem value="reserve">Зарезервировать</MenuItem>
                  <MenuItem value="nullify">Обнулить</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    defaultChecked={editingStatus?.hide_from_webmaster || false}
                  />
                }
                label="Скрывать данные от вебмастера"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    defaultChecked={editingStatus?.always_send_sms || false}
                  />
                }
                label="Всегда отсылать авто SMS"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Отмена
          </Button>
          <Button variant="contained">
            {editingStatus ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Container Management Dialog */}
      <Dialog open={containerDialogOpen} onClose={() => setContainerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Контейнеры статусов</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Контейнеры позволяют группировать статусы для удобства, особенно когда статусов много.
            Они не участвуют в технических настройках.
          </Typography>
          
          {containers.map((container) => (
            <Card key={container.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{container.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {container.description}
                    </Typography>
                    <Chip
                      label={`${container.statuses_count} статусов`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
          >
            Добавить контейнер
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContainerDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderStatuses;