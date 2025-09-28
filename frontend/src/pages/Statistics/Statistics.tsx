import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

const Statistics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Статистика
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Детальная статистика
          </Typography>
          <Typography color="text.secondary">
            Страница с детальной статистикой в разработке...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Statistics;