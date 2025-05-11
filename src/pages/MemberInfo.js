import React, { useState, useEffect } from 'react';
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
  Typography,
} from '@mui/material';
import axios from 'axios';

const MemberInfo = ({ match }) => {
  const [member, setMember] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const memberId = match.params.id;

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    try {
      const response = await axios.get(`/api/members/${memberId}`);
      setMember(response.data);
    } catch (error) {
      console.error('Error fetching member:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/members/${memberId}`, member);
      setEditMode(false);
      alert('Member information updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Error updating member information. Please try again.');
    }
  };

  if (!member) return <div>Loading...</div>;

  return (
    <Container maxWidth="md" style={{ marginTop: '20px' }}>
      <Paper elevation={3} style={{ padding: '20px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Typography variant="h5">Member Information</Typography>
          <Button variant="contained" color="primary" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : 'Edit'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={member.name}
            onChange={e => setMember({ ...member, name: e.target.value })}
            fullWidth
            disabled={!editMode}
          />

          <FormControl fullWidth disabled={!editMode}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={member.gender}
              onChange={e => setMember({ ...member, gender: e.target.value })}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Date of Birth"
            type="date"
            value={member.dateOfBirth}
            onChange={e => setMember({ ...member, dateOfBirth: e.target.value })}
            fullWidth
            disabled={!editMode}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth disabled={!editMode}>
            <InputLabel>Purpose</InputLabel>
            <Select
              value={member.purpose}
              onChange={e => setMember({ ...member, purpose: e.target.value })}
            >
              <MenuItem value="pain_management">Pain Management</MenuItem>
              <MenuItem value="diet">Diet</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Phone Number"
            value={member.phoneNumber}
            onChange={e => setMember({ ...member, phoneNumber: e.target.value })}
            fullWidth
            disabled={!editMode}
          />

          <TextField
            label="Notes"
            value={member.notes}
            onChange={e => setMember({ ...member, notes: e.target.value })}
            multiline
            rows={4}
            fullWidth
            disabled={!editMode}
          />

          <TextField
            label="남은 관리횟수"
            value={member.remaining_sessions}
            onChange={e => setMember({ ...member, remaining_sessions: parseInt(e.target.value) })}
            fullWidth
            disabled={!editMode}
          />
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            {/* 공유 중 칩 */}
            {(() => {
              let sharedWithArr = [];
              try {
                sharedWithArr = Array.isArray(member.shared_with)
                  ? member.shared_with
                  : JSON.parse(member.shared_with);
              } catch {
                sharedWithArr = [];
              }
              return sharedWithArr.length > 0 ? (
                <span
                  style={{
                    display: 'inline-block',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: 8,
                    padding: '2px 8px',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  공유 중
                </span>
              ) : null;
            })()}
            {/* 의존 중 칩 */}
            {member.depends_on && (
              <span
                style={{
                  display: 'inline-block',
                  background: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: 8,
                  padding: '2px 8px',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                의존 중
              </span>
            )}
          </Box>

          <TextField label="Join Date" value={member.joinDate} fullWidth disabled />

          <TextField
            label="Last Visit Date"
            value={member.lastVisitDate || 'Not visited yet'}
            fullWidth
            disabled
          />

          {editMode && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdate}
              style={{ marginTop: '20px' }}
            >
              Save Changes
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MemberInfo;
