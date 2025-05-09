import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#FFFBEA',
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="#E8E0DE">
        © {new Date().getFullYear()} Park Jong Chul. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer; 