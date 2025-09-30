import React, { useState } from 'react';
import { Navigate, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
  FormControlLabel,
  Checkbox,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  company: string;
  position: string;
  industry: string;
  employeeCount: string;
  role: string;
  agreeToTerms: boolean;
  agreeToNewsletter: boolean;
}

const Register: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    position: '',
    industry: '',
    employeeCount: '',
    role: 'operator',
    agreeToTerms: false,
    agreeToNewsletter: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/project-selection" replace />;
  }

  const industries = [
    'E-commerce',
    'Образование',
    'Финансы',
    'Здравоохранение',
    'IT/Технологии',
    'Недвижимость',
    'Производство',
    'Ретейл',
    'Услуги',
    'Другое',
  ];

  const employeeCounts = [
    '1-10',
    '11-50',
    '51-100',
    '101-500',
    '500+',
  ];

  const roles = [
    { value: 'operator', label: 'Оператор' },
    { value: 'admin', label: 'Администратор' },
    { value: 'designer', label: 'Дизайнер' },
    { value: 'webmaster', label: 'Веб-мастер' },
    { value: 'representative', label: 'Представитель' },
  ];

  const handleInputChange = (field: keyof RegistrationFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = event.target;
    const value = target.type === 'checkbox' 
      ? target.checked 
      : target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: keyof RegistrationFormData) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.firstName || !formData.lastName) {
      return 'Пожалуйста, введите имя и фамилию';
    }
    
    if (!formData.email) {
      return 'Пожалуйста, введите email';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Пожалуйста, введите корректный email';
    }
    
    if (!formData.password) {
      return 'Пожалуйста, введите пароль';
    }
    
    if (formData.password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Пароли не совпадают';
    }
    
    if (!formData.company) {
      return 'Пожалуйста, введите название компании';
    }
    
    if (!formData.agreeToTerms) {
      return 'Необходимо согласиться с условиями использования';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    
    try {
      // Prepare data for API
      const registrationData = {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        role: formData.role,
        password: formData.password,
      };

      // Send registration request to API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка регистрации');
      }

      const result = await response.json();
      
      // Show success and redirect
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Регистрация успешна! Войдите в систему.' 
          } 
        });
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Произошла ошибка при регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                backgroundColor: 'success.main',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Typography variant="h3" color="white">
                ✓
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Регистрация успешна!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Мы отправили письмо с подтверждением на {formData.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Перенаправляем на страницу входа...
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                backgroundColor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Typography variant="h3" color="white" fontWeight="bold">
                LV
              </Typography>
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Создать аккаунт
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Присоединяйтесь к 50 000+ компаний, которые доверяют LeadVertex
            </Typography>
          </Box>

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Личная информация
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Фамилия"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={loading}
                  placeholder="+7 (900) 123-45-67"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Роль</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleSelectChange('role')}
                    disabled={loading}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Пароль"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  disabled={loading}
                  helperText="Минимум 6 символов"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Подтвердите пароль"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  required
                  disabled={loading}
                />
              </Grid>

              {/* Company Information */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Информация о компании
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Название компании"
                  value={formData.company}
                  onChange={handleInputChange('company')}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Должность"
                  value={formData.position}
                  onChange={handleInputChange('position')}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Отрасль</InputLabel>
                  <Select
                    value={formData.industry}
                    onChange={handleSelectChange('industry')}
                    disabled={loading}
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry} value={industry}>
                        {industry}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Количество сотрудников</InputLabel>
                  <Select
                    value={formData.employeeCount}
                    onChange={handleSelectChange('employeeCount')}
                    disabled={loading}
                  >
                    {employeeCounts.map((count) => (
                      <MenuItem key={count} value={count}>
                        {count}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Agreements */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange('agreeToTerms')}
                      disabled={loading}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Я соглашаюсь с{' '}
                      <Link href="#" underline="hover">
                        условиями использования
                      </Link>{' '}
                      и{' '}
                      <Link href="#" underline="hover">
                        политикой конфиденциальности
                      </Link>
                    </Typography>
                  }
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeToNewsletter}
                      onChange={handleInputChange('agreeToNewsletter')}
                      disabled={loading}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Я хочу получать новости и специальные предложения по email
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Создать аккаунт'
              )}
            </Button>

            {/* Links */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Уже есть аккаунт?{' '}
                <Link component={RouterLink} to="/login" underline="hover">
                  Войти
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 LeadVertex Clone. Создано для демонстрации.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;