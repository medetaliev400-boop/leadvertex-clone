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
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneCallback as CallbackIcon,
  CallEnd as HangupIcon,
  VolumeUp as VolumeIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  RecordVoiceOver as RecordIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Project, Call } from '../../services/api';

interface CallSession {
  id: string;
  phone: string;
  customerName?: string;
  orderId?: number;
  status: 'connecting' | 'ringing' | 'active' | 'hold' | 'ended';
  startTime: Date;
  duration: number;
  isRecording: boolean;
  isMuted: boolean;
}

interface TelephonyStats {
  totalCalls: number;
  callsToday: number;
  averageDuration: number;
  answerRate: number;
  activeCalls: number;
  queueSize: number;
}

const Telephony: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Call management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  
  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sipSettings, setSipSettings] = useState({
    server: '',
    username: '',
    password: '',
    outgoingNumber: '',
    recordingEnabled: true,
    autoAnswer: false,
  });

  // Mock data
  const mockStats: TelephonyStats = {
    totalCalls: 1247,
    callsToday: 89,
    averageDuration: 156, // seconds
    answerRate: 73.2,
    activeCalls: 3,
    queueSize: 7,
  };

  const mockCallHistory: Call[] = [
    {
      id: 1,
      operator_id: 1,
      operator_name: 'Анна Петрова',
      phone_number: '+7 (900) 123-45-67',
      direction: 'outgoing',
      status: 'answered',
      duration: 245,
      started_at: '2025-01-26T14:30:00Z',
      ended_at: '2025-01-26T14:34:05Z',
      notes: 'Клиент заинтересован, назначен повторный звонок',
      order_id: 12345,
    },
    {
      id: 2,
      operator_id: 1,
      operator_name: 'Анна Петрова',
      phone_number: '+7 (911) 987-65-43',
      direction: 'outgoing',
      status: 'no_answer',
      duration: 0,
      started_at: '2025-01-26T14:15:00Z',
      notes: 'Не отвечает, запланирован повторный звонок',
    },
    {
      id: 3,
      operator_id: 2,
      operator_name: 'Михаил Сидоров',
      phone_number: '+7 (495) 123-45-67',
      direction: 'incoming',
      status: 'answered',
      duration: 367,
      started_at: '2025-01-26T13:45:00Z',
      ended_at: '2025-01-26T13:51:07Z',
      notes: 'Консультация по товару, заказ оформлен',
    },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadCallHistory();
    }
  }, [selectedProject]);

  // Timer for active calls
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCalls(prev => prev.map(call => ({
        ...call,
        duration: call.status === 'active' ? 
          Math.floor((Date.now() - call.startTime.getTime()) / 1000) : 
          call.duration
      })));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const loadCallHistory = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      // In real app: const response = await apiService.getCalls(selectedProject);
      setTimeout(() => {
        setCallHistory(mockCallHistory);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading call history:', error);
      setError('Не удалось загрузить историю звонков');
      setLoading(false);
    }
  };

  const makeCall = async (phone: string, orderId?: number) => {
    try {
      const newCall: CallSession = {
        id: Date.now().toString(),
        phone,
        orderId,
        status: 'connecting',
        startTime: new Date(),
        duration: 0,
        isRecording: sipSettings.recordingEnabled,
        isMuted: false,
      };

      setActiveCalls(prev => [...prev, newCall]);
      setCurrentCall(newCall);

      // Simulate call connection
      setTimeout(() => {
        setActiveCalls(prev => prev.map(call => 
          call.id === newCall.id ? { ...call, status: 'ringing' } : call
        ));
      }, 1000);

      setTimeout(() => {
        setActiveCalls(prev => prev.map(call => 
          call.id === newCall.id ? { ...call, status: 'active' } : call
        ));
      }, 3000);

    } catch (error) {
      console.error('Error making call:', error);
      setError('Не удалось выполнить звонок');
    }
  };

  const endCall = (callId: string) => {
    setActiveCalls(prev => prev.map(call => 
      call.id === callId ? { ...call, status: 'ended' } : call
    ));
    
    setTimeout(() => {
      setActiveCalls(prev => prev.filter(call => call.id !== callId));
      if (currentCall?.id === callId) {
        setCurrentCall(null);
      }
    }, 2000);
  };

  const toggleMute = (callId: string) => {
    setActiveCalls(prev => prev.map(call => 
      call.id === callId ? { ...call, isMuted: !call.isMuted } : call
    ));
  };

  const toggleRecording = (callId: string) => {
    setActiveCalls(prev => prev.map(call => 
      call.id === callId ? { ...call, isRecording: !call.isRecording } : call
    ));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    return phone.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'success';
      case 'no_answer': return 'warning';
      case 'busy': return 'error';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'answered': return 'Отвечен';
      case 'no_answer': return 'Не отвечает';
      case 'busy': return 'Занято';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  if (!projects.length && !loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Телефония
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
          Телефония
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
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
          >
            Настройки
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PhoneIcon />}
            onClick={() => setIsCallDialogOpen(true)}
          >
            Позвонить
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PhoneIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {mockStats.totalCalls}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего звонков
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PhoneIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {mockStats.callsToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Сегодня
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimerIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formatDuration(mockStats.averageDuration)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Средняя длительность
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CallbackIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {mockStats.answerRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Процент дозвона
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PhoneIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {mockStats.activeCalls}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Активные звонки
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {mockStats.queueSize}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                В очереди
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Активные звонки
            </Typography>
            <Grid container spacing={2}>
              {activeCalls.map((call) => (
                <Grid item xs={12} md={6} lg={4} key={call.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          {formatPhoneNumber(call.phone)}
                        </Typography>
                        <Chip 
                          label={call.status}
                          color={call.status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      
                      {call.customerName && (
                        <Typography variant="body2" gutterBottom>
                          {call.customerName}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Длительность: {formatDuration(call.duration)}
                      </Typography>
                      
                      <Box display="flex" gap={1} mt={2}>
                        <IconButton 
                          size="small"
                          color={call.isMuted ? 'error' : 'default'}
                          onClick={() => toggleMute(call.id)}
                        >
                          {call.isMuted ? <MicOffIcon /> : <MicIcon />}
                        </IconButton>
                        
                        <IconButton 
                          size="small"
                          color={call.isRecording ? 'error' : 'default'}
                          onClick={() => toggleRecording(call.id)}
                        >
                          <RecordIcon />
                        </IconButton>
                        
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => endCall(call.id)}
                        >
                          <HangupIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="История звонков" />
          <Tab label="Настройки SIP" />
          <Tab label="Роботы-звонки" />
        </Tabs>
      </Box>

      {/* Call History Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              История звонков
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Время</TableCell>
                      <TableCell>Номер</TableCell>
                      <TableCell>Оператор</TableCell>
                      <TableCell>Направление</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Длительность</TableCell>
                      <TableCell>Заметки</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {callHistory.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>
                          {new Date(call.started_at).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatPhoneNumber(call.phone_number)}
                          </Typography>
                        </TableCell>
                        <TableCell>{call.operator_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={call.direction === 'incoming' ? 'Входящий' : 'Исходящий'}
                            color={call.direction === 'incoming' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusText(call.status)}
                            color={getStatusColor(call.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {call.duration > 0 ? formatDuration(call.duration) : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {call.notes || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                          {call.recording_url && (
                            <IconButton size="small">
                              <PlayIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* SIP Settings Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Настройки SIP
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SIP сервер"
                  value={sipSettings.server}
                  onChange={(e) => setSipSettings({ ...sipSettings, server: e.target.value })}
                  placeholder="sip.example.com"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Исходящий номер"
                  value={sipSettings.outgoingNumber}
                  onChange={(e) => setSipSettings({ ...sipSettings, outgoingNumber: e.target.value })}
                  placeholder="+7 (495) 123-45-67"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  value={sipSettings.username}
                  onChange={(e) => setSipSettings({ ...sipSettings, username: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Пароль"
                  value={sipSettings.password}
                  onChange={(e) => setSipSettings({ ...sipSettings, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sipSettings.recordingEnabled}
                      onChange={(e) => setSipSettings({ ...sipSettings, recordingEnabled: e.target.checked })}
                    />
                  }
                  label="Запись разговоров"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sipSettings.autoAnswer}
                      onChange={(e) => setSipSettings({ ...sipSettings, autoAnswer: e.target.checked })}
                    />
                  }
                  label="Автоответ"
                />
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
            <Button variant="contained">
              Сохранить настройки
            </Button>
            <Button variant="outlined">
              Тестировать соединение
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Robot Calls Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Настройки робо-звонков
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Робо-звонки позволяют автоматически обзванивать клиентов по расписанию или триггерам.
            </Alert>
            <Typography variant="body1">
              Функция робо-звонков будет доступна в следующих версиях системы.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onClose={() => setIsCallDialogOpen(false)}>
        <DialogTitle>Совершить звонок</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Номер телефона"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+7 (900) 123-45-67"
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCallDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (phoneNumber) {
                makeCall(phoneNumber);
                setIsCallDialogOpen(false);
                setPhoneNumber('');
              }
            }}
            disabled={!phoneNumber}
          >
            Позвонить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Настройки телефонии</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Здесь можно настроить параметры телефонии для проекта.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Telephony;