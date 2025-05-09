import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const BROWN_BG = '#f6e7d7';
const BROWN_TEXT = '#3C1E1E';

const AddMemberDialog = React.memo(({ open, onClose, onAdd }) => {
  const [newMember, setNewMember] = useState({
    name: '',
    gender: '남',
    birthDate: '',
    purpose: '다이어트',
    phone: '',
    remainCount: 12,
    notes: '',
    relationship: ''
  });

  const handleChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!newMember.name || !newMember.birthDate || !newMember.phone) {
      alert('이름, 생년월일, 전화번호는 필수입니다.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await axios.post('http://localhost:3001/members', {
        ...newMember,
        birth_date: newMember.birthDate,
        join_date: today,
        last_visit: '',
        notes: newMember.notes || '',
        remaining_sessions: newMember.remainCount,
        birthDate: undefined,
        remainCount: undefined
      });
      
      onAdd(response.data);
      setNewMember({
        name: '',
        gender: '남',
        birthDate: '',
        purpose: '다이어트',
        phone: '',
        remainCount: 12,
        notes: '',
        relationship: ''
      });
      onClose();
    } catch (error) {
      alert('회원 등록에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>회원 등록</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="이름"
            value={newMember.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <ToggleButtonGroup
            value={newMember.gender}
            exclusive
            onChange={(_, v) => v && handleChange('gender', v)}
            sx={{ width: '100%' }}
          >
            <ToggleButton value="남" sx={{ flex: 1 }}>남</ToggleButton>
            <ToggleButton value="여" sx={{ flex: 1 }}>여</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="생년월일"
            type="date"
            value={newMember.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <ToggleButtonGroup
            value={newMember.purpose}
            exclusive
            onChange={(_, v) => v && handleChange('purpose', v)}
            sx={{ width: '100%' }}
          >
            <ToggleButton value="다이어트" sx={{ flex: 1 }}>다이어트</ToggleButton>
            <ToggleButton value="통증" sx={{ flex: 1 }}>통증</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="전화번호"
            value={newMember.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="남은 관리횟수"
            type="number"
            value={newMember.remainCount}
            onChange={(e) => handleChange('remainCount', Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="소개(관계)"
            value={newMember.relationship}
            onChange={(e) => handleChange('relationship', e.target.value)}
            fullWidth
          />
          <TextField
            label="특이사항"
            value={newMember.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained">등록</Button>
      </DialogActions>
    </Dialog>
  );
});

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [newMember, setNewMember] = useState({
    name: '',
    gender: '남',
    birthDate: '',
    purpose: '다이어트',
    phone: '',
    remainCount: 12,
    notes: '',
    relationship: ''
  });
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
  const [purposeStats, setPurposeStats] = useState({ diet: 0, pain: 0 });
  const [editCell, setEditCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  // 검색어 변경 시에만 필터링
  useEffect(() => {
    // 회원 추가 모달이 열려있을 때는 필터링하지 않음
    if (openAddDialog) {
      setFilteredMembers(members);
      return;
    }
    
    const filtered = members.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.relationship?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
    setPage(0);
  }, [searchTerm, openAddDialog]);

  // members가 변경될 때만 filteredMembers 업데이트
  useEffect(() => {
    if (!searchTerm && !openAddDialog) {
      setFilteredMembers(members);
    }
  }, [members]);

  useEffect(() => {
    if (members.length > 0) {
      // 성별 통계 계산
      const genderCount = members.reduce((acc, member) => {
        acc[member.gender] = (acc[member.gender] || 0) + 1;
        return acc;
      }, {});
      setGenderStats({
        male: genderCount['남'] || 0,
        female: genderCount['여'] || 0
      });

      // 목적 통계 계산
      const purposeCount = members.reduce((acc, member) => {
        acc[member.purpose] = (acc[member.purpose] || 0) + 1;
        return acc;
      }, {});
      setPurposeStats({
        diet: purposeCount['다이어트'] || 0,
        pain: purposeCount['통증'] || 0
      });
    }
  }, [members]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/members');
      setMembers(response.data);
    } catch (error) {
      console.error('회원 목록을 불러오는데 실패했습니다:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddMember = (newMemberData) => {
    setMembers(prev => [...prev, newMemberData]);
    if (!searchTerm) {
      setFilteredMembers(prev => [...prev, newMemberData]);
    }
    window.dispatchEvent(new Event('memberChange'));
  };

  const handleEditMember = async () => {
    try {
      await axios.patch(`http://localhost:3001/members/${selectedMember.id}`, {
        name: selectedMember.name,
        gender: selectedMember.gender,
        birth_date: selectedMember.birth_date,
        purpose: selectedMember.purpose,
        phone: selectedMember.phone,
        notes: selectedMember.notes,
        relationship: selectedMember.relationship
      });
      
      setOpenEditDialog(false);
      await fetchMembers(); // 서버에서 최신 데이터를 가져옵니다
    } catch (error) {
      alert('회원 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`http://localhost:3001/members/${memberId}`);
        const updatedMembers = members.filter(member => member.id !== memberId);
        setMembers(updatedMembers);
        setFilteredMembers(updatedMembers);
        setSearchTerm('');
        
        // 회원 변경 이벤트 발생
        window.dispatchEvent(new Event('memberChange'));
      } catch (error) {
        console.error('회원 삭제 실패:', error);
        alert('회원 삭제에 실패했습니다.');
      }
    }
  };

  const getKoreanAge = (birthDateStr) => {
    if (!birthDateStr) return '';
    const today = new Date();
    const birth = new Date(birthDateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  const handleInlineEdit = (id, field, value) => {
    setEditCell({ id, field });
    setEditValue(value);
  };

  const handleInlineCancel = () => {
    setEditCell({ id: null, field: null });
    setEditValue('');
  };

  const handleInlineSave = async (member) => {
    try {
      await axios.patch(`http://localhost:3001/members/${member.id}`, {
        [editCell.field]: editValue
      });
      
      setEditCell({ id: null, field: null });
      setEditValue('');
      await fetchMembers(); // 서버에서 최신 데이터를 가져옵니다
    } catch (error) {
      alert('수정에 실패했습니다.');
    }
  };

  const handleInlineDelete = async (member, field) => {
    try {
      const newValue = field === 'remaining_sessions' ? 0 : '';
      await axios.patch(`http://localhost:3001/members/${member.id}`, {
        [field]: newValue
      });
      
      await fetchMembers(); // 서버에서 최신 데이터를 가져옵니다
    } catch (error) {
      alert('초기화에 실패했습니다.');
    }
  };

  const handleNewMemberChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: BROWN_TEXT }} />
          <Typography variant="h5">회원 관리</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="회원 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 240 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              background: BROWN_BG,
              color: BROWN_TEXT,
              '&:hover': { background: '#e0cfc0' }
            }}
          >
            회원 추가
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>성별 비율</Typography>
              <Box sx={{ width: '100%', height: 20, display: 'flex', borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                <Box
                  sx={{
                    width: `${getPercentage(genderStats.male, genderStats.male + genderStats.female)}%`,
                    background: '#ffe082',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3C1E1E',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  {genderStats.male > 0 ? `${genderStats.male} (${getPercentage(genderStats.male, genderStats.male + genderStats.female).toFixed(0)}%)` : ''}
                </Box>
                <Box
                  sx={{
                    width: `${getPercentage(genderStats.female, genderStats.male + genderStats.female)}%`,
                    background: '#90caf9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3C1E1E',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  {genderStats.female > 0 ? `${genderStats.female} (${getPercentage(genderStats.female, genderStats.male + genderStats.female).toFixed(0)}%)` : ''}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#ffe082', fontWeight: 700 }}>남성</Typography>
                <Typography variant="body2" sx={{ color: '#90caf9', fontWeight: 700 }}>여성</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>목적 비율</Typography>
              <Box sx={{ width: '100%', height: 20, display: 'flex', borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                <Box
                  sx={{
                    width: `${getPercentage(purposeStats.diet, purposeStats.diet + purposeStats.pain)}%`,
                    background: '#aed581',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3C1E1E',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  {purposeStats.diet > 0 ? `${purposeStats.diet} (${getPercentage(purposeStats.diet, purposeStats.diet + purposeStats.pain).toFixed(0)}%)` : ''}
                </Box>
                <Box
                  sx={{
                    width: `${getPercentage(purposeStats.pain, purposeStats.diet + purposeStats.pain)}%`,
                    background: '#ce93d8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3C1E1E',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  {purposeStats.pain > 0 ? `${purposeStats.pain} (${getPercentage(purposeStats.pain, purposeStats.diet + purposeStats.pain).toFixed(0)}%)` : ''}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#aed581', fontWeight: 700 }}>다이어트</Typography>
                <Typography variant="body2" sx={{ color: '#ce93d8', fontWeight: 700 }}>통증</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>성별</TableCell>
              <TableCell>생년월일</TableCell>
              <TableCell>목적</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>소개(관계)</TableCell>
              <TableCell>특이사항</TableCell>
              <TableCell>남은 관리횟수</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.gender}</TableCell>
                  <TableCell>
                    {member.birth_date} (만 {getKoreanAge(member.birth_date)}세)
                  </TableCell>
                  <TableCell>{member.purpose}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{member.relationship || '-'}</TableCell>
                  <TableCell sx={{ position: 'relative', minWidth: 120 }}>
                    <span>{member.notes || '-'}</span>
                  </TableCell>
                  <TableCell sx={{ position: 'relative', minWidth: 120 }}>
                    {editCell.id === member.id && editCell.field === 'remaining_sessions' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          value={editValue}
                          onChange={e => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                          size="small"
                          fullWidth
                          type="number"
                          inputProps={{ min: 0 }}
                        />
                        <IconButton onClick={() => handleInlineSave(member)} size="small" color="primary"><SaveIcon /></IconButton>
                        <IconButton onClick={handleInlineCancel} size="small"><CancelIcon /></IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative', minHeight: 32, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{member.remaining_sessions}회</span>
                        {member.remaining_sessions < 3 && (
                          <Chip
                            label="관리횟수 부족"
                            color="warning"
                            size="small"
                            sx={{
                              background: '#fff3e0',
                              color: '#e65100',
                              fontWeight: 600
                            }}
                          />
                        )}
                        <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 0.5 }}>
                          <Tooltip title="수정"><IconButton size="small" onClick={() => handleInlineEdit(member.id, 'remaining_sessions', member.remaining_sessions)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="초기화"><IconButton size="small" onClick={() => handleInlineDelete(member, 'remaining_sessions')}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="수정">
                        <IconButton
                          onClick={() => {
                            setSelectedMember(member);
                            setOpenEditDialog(true);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          onClick={() => handleDeleteMember(member.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredMembers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
        />
      </TableContainer>

      <AddMemberDialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        onAdd={handleAddMember}
      />

      {/* 회원 수정 다이얼로그 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>회원 정보 수정</DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="이름"
                value={selectedMember.name}
                onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                fullWidth
                required
              />
              <ToggleButtonGroup
                value={selectedMember.gender}
                exclusive
                onChange={(_, v) => v && setSelectedMember({ ...selectedMember, gender: v })}
                sx={{ width: '100%' }}
              >
                <ToggleButton value="남" sx={{ flex: 1 }}>남</ToggleButton>
                <ToggleButton value="여" sx={{ flex: 1 }}>여</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                label="생년월일"
                type="date"
                value={selectedMember.birth_date}
                onChange={(e) => setSelectedMember({ ...selectedMember, birth_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <ToggleButtonGroup
                value={selectedMember.purpose}
                exclusive
                onChange={(_, v) => v && setSelectedMember({ ...selectedMember, purpose: v })}
                sx={{ width: '100%' }}
              >
                <ToggleButton value="다이어트" sx={{ flex: 1 }}>다이어트</ToggleButton>
                <ToggleButton value="통증" sx={{ flex: 1 }}>통증</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                label="전화번호"
                value={selectedMember.phone}
                onChange={(e) => setSelectedMember({ ...selectedMember, phone: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="소개(관계)"
                value={selectedMember.relationship}
                onChange={(e) => setSelectedMember({ ...selectedMember, relationship: e.target.value })}
                fullWidth
              />
              <TextField
                label="특이사항"
                value={selectedMember.notes}
                onChange={(e) => setSelectedMember({ ...selectedMember, notes: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>취소</Button>
          <Button onClick={handleEditMember} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberManagement;