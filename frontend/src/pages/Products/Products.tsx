import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

const Products: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Товары
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Управление товарами
          </Typography>
          <Typography color="text.secondary">
            Страница управления товарами в разработке...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Products;