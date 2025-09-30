import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  Psychology as AIIcon,
  Analytics as AnalyticsIcon,
  Phone as PhoneIcon,
  Store as StoreIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: 'Увеличение конверсии',
      description: 'Повышение конверсии продаж до 30% благодаря умной CRM и автоматизации',
      color: '#4CAF50',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Быстрый старт',
      description: 'Настройка и запуск за 15 минут. Готовые шаблоны и интеграции',
      color: '#2196F3',
    },
    {
      icon: <PhoneIcon sx={{ fontSize: 40 }} />,
      title: 'Встроенная телефония',
      description: 'Автоматические звонки, запись разговоров, аналитика операторов',
      color: '#FF9800',
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Мощная аналитика',
      description: 'Детальная статистика продаж, прогнозы, отчеты в реальном времени',
      color: '#9C27B0',
    },
    {
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      title: 'AI-ассистент',
      description: 'Умные рекомендации, автоматическая сегментация клиентов',
      color: '#E91E63',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Защита данных',
      description: 'Шифрование, резервное копирование, соответствие GDPR',
      color: '#607D8B',
    },
  ];

  const tariffs = [
    {
      name: 'Стартер',
      price: '2 990',
      period: 'мес.',
      popular: false,
      features: [
        'До 1 000 заказов',
        'Базовая CRM',
        'Email поддержка',
        '1 пользователь',
        'Базовая телефония',
      ],
    },
    {
      name: 'Стандарт',
      price: '6 990',
      period: 'мес.',
      popular: true,
      features: [
        'До 5 000 заказов',
        'CRM + Телефония',
        'Приоритетная поддержка',
        '5 пользователей',
        'Расширенная аналитика',
        'Интеграции',
      ],
    },
    {
      name: 'Бизнес',
      price: '12 990',
      period: 'мес.',
      popular: false,
      features: [
        'Безлимитные заказы',
        'Полный функционал',
        'Персональный менеджер',
        '15 пользователей',
        'API доступ',
        'Белый лейбл',
      ],
    },
  ];

  const stats = [
    { number: '50 000+', label: 'Клиентов доверяют нам' },
    { number: '98%', label: 'Остаются после пробного периода' },
    { number: '30%', label: 'Средний рост конверсии' },
    { number: '24/7', label: 'Поддержка на русском языке' },
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar position="fixed" sx={{ backgroundColor: 'white', boxShadow: 1 }}>
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
            <Typography variant="h6" color="text.primary" fontWeight="bold">
              LeadVertex
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="primary" 
              onClick={() => navigate('/login')}
            >
              Войти
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/register')}
            >
              Регистрация
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 12,
          pb: 8,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                CRM для лидогенерации
                <Box component="span" sx={{ color: '#FFD700' }}> нового поколения</Box>
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Увеличьте продажи на 30% с помощью умной автоматизации, 
                встроенной телефонии и AI-аналитики
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    py: 1.5,
                    px: 4,
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.9),
                    },
                  }}
                  onClick={() => navigate('/register')}
                >
                  Попробовать бесплатно
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    py: 1.5,
                    px: 4,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: alpha('#fff', 0.1),
                    },
                  }}
                >
                  Смотреть демо
                </Button>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                ✓ Бесплатный пробный период 14 дней
                ✓ Настройка за 15 минут
                ✓ Поддержка 24/7
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  background: alpha('#fff', 0.1),
                  borderRadius: 4,
                  p: 4,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  🚀 Статистика в реальном времени
                </Typography>
                <Grid container spacing={2}>
                  {stats.map((stat, index) => (
                    <Grid item xs={6} key={index}>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.number}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {stat.label}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Все инструменты для роста продаж
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Полноценная экосистема для управления лидами и увеличения конверсии
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: alpha(feature.color, 0.1),
                      color: feature.color,
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Выберите ваш тариф
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Гибкие цены для бизнеса любого размера
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {tariffs.map((tariff, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: tariff.popular ? `2px solid ${theme.palette.primary.main}` : 'none',
                    transform: tariff.popular ? 'scale(1.05)' : 'none',
                  }}
                >
                  {tariff.popular && (
                    <Chip
                      label="Популярный"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {tariff.name}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {tariff.price}
                        <Typography component="span" variant="h6" color="text.secondary">
                          ₽/{tariff.period}
                        </Typography>
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      {tariff.features.map((feature, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 4, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={tariff.popular ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => navigate('/register')}
                    >
                      Выбрать план
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Готовы увеличить продажи?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Присоединяйтесь к 50 000+ компаний, которые уже используют LeadVertex
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              py: 2,
              px: 6,
              '&:hover': {
                backgroundColor: alpha('#fff', 0.9),
              },
            }}
            onClick={() => navigate('/register')}
          >
            Начать бесплатно
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © 2025 LeadVertex Clone. CRM для лидогенерации нового поколения.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Поддержка: support@leadvertex.com
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Телефон: +7 (495) 123-45-67
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;