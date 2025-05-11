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
  Box,
} from '@mui/material';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birth_date: '',
    purpose: '',
    phone: '',
    notes: '',
    remaining_sessions: 0,
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.post('http://localhost:3001/api/members', {
        ...formData,
        join_date: today,
        last_visit: today,
        shared_with: '[]',
        relationship: '',
      });
      
      alert('회원이 등록되었습니다!');
      setFormData({
        name: '',
        gender: '',
        birth_date: '',
        purpose: '',
        phone: '',
        notes: '',
        remaining_sessions: 0,
      });
    } catch (error) {
      console.error('회원 등록 실패:', error);
      alert('회원 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <h2>회원 등록</h2>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="name"
              label="이름"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <FormControl>
              <InputLabel>성별</InputLabel>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <MenuItem value="남">남</MenuItem>
                <MenuItem value="여">여</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="birth_date"
              label="생년월일"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl>
              <InputLabel>목적</InputLabel>
              <Select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
              >
                <MenuItem value="다이어트">다이어트</MenuItem>
                <MenuItem value="통증">통증</MenuItem>
                <MenuItem value="재활">재활</MenuItem>
                <MenuItem value="기타">기타</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="phone"
              label="전화번호"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <TextField
              name="notes"
              label="비고"
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleChange}
            />
            <Button type="submit" variant="contained" color="primary">
              등록
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
