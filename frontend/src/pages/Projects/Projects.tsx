import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

const Projects: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Проекты
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Управление проектами
          </Typography>
          <Typography color="text.secondary">
            Страница управления проектами в разработке...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Projects;