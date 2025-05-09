import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Select, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel, 
  Box 
} from '@mui/material';
import { createMember } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    purpose: '',
    phoneNumber: '',
    notes: '',
    points: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMember({
        ...formData,
        joinDate: new Date().toISOString().split('T')[0],
        lastVisitDate: null
      });
      alert('Member registered successfully!');
      setFormData({
        name: '',
        gender: '',
        dateOfBirth: '',
        purpose: '',
        phoneNumber: '',
        notes: '',
        points: 0
      });
    } catch (error) {
      console.error('Error registering member:', error);
      alert('Error registering member. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '20px' }}>
      <Paper elevation={3} style={{ padding: '20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register New Member</h2>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Purpose</InputLabel>
              <Select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
              >
                <MenuItem value="pain_management">Pain Management</MenuItem>
                <MenuItem value="diet">Diet</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              style={{ marginTop: '20px' }}
            >
              Register Member
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
