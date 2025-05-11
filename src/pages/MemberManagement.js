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
  LinearProgress,
  Autocomplete,
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

const AddMemberDialog = React.memo(({ open, onClose, onAdd, members }) => {
  const [newMember, setNewMember] = useState({
    name: '',
    gender: '남',
    birthDate: '',
    purpose: '다이어트',
    phone: '',
    remainCount: 12,
    notes: '',
    relationship: '',
  });
  const [selectedSharedMember, setSelectedSharedMember] = useState(null);
  const [sharedMembers, setSharedMembers] = useState([]);

  const handleChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
  };

  const handleSharedMemberChange = (event, newValue) => {
    if (newValue && !sharedMembers.find(m => m.id === newValue.id)) {
      setSharedMembers([...sharedMembers, newValue]);
    }
    setSelectedSharedMember(null);
  };

  const handleRemoveSharedMember = memberId => {
    setSharedMembers(sharedMembers.filter(m => m.id !== memberId));
  };

  const handleSubmit = async () => {
    if (!newMember.name || !newMember.birthDate || !newMember.phone) {
      alert('이름, 생년월일, 전화번호는 필수입니다.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await axios.post('http://localhost:3001/api/members', {
        ...newMember,
        birth_date: newMember.birthDate,
        join_date: today,
        last_visit: today,
        notes: newMember.notes || '',
        remaining_sessions: newMember.remainCount,
        birthDate: undefined,
        remainCount: undefined,
        shared_with: JSON.stringify(sharedMembers.map(m => m.id)),
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
        relationship: '',
      });
      setSharedMembers([]);
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
            onChange={e => handleChange('name', e.target.value)}
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
            <ToggleButton value="남" sx={{ flex: 1 }}>
              남
            </ToggleButton>
            <ToggleButton value="여" sx={{ flex: 1 }}>
              여
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="생년월일"
            type="date"
            value={newMember.birthDate}
            onChange={e => handleChange('birthDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: `${new Date().getFullYear()}-12-31`,
              min: '1900-01-01',
            }}
            fullWidth
            required
          />
          <ToggleButtonGroup
            value={newMember.purpose}
            exclusive
            onChange={(_, v) => v && handleChange('purpose', v)}
            sx={{ width: '100%' }}
          >
            <ToggleButton value="다이어트" sx={{ flex: 1 }}>
              다이어트
            </ToggleButton>
            <ToggleButton value="통증" sx={{ flex: 1 }}>
              통증
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="전화번호"
            value={newMember.phone}
            onChange={e => handleChange('phone', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="남은 관리횟수"
            type="number"
            value={newMember.remainCount}
            onChange={e => handleChange('remainCount', Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="소개(관계)"
            value={newMember.relationship}
            onChange={e => handleChange('relationship', e.target.value)}
            fullWidth
          />
          <TextField
            label="특이사항"
            value={newMember.notes}
            onChange={e => handleChange('notes', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              관리 횟수 연결
            </Typography>
            <Autocomplete
              options={members.filter(m => !sharedMembers.find(sm => sm.id === m.id))}
              getOptionLabel={option => {
                let sharedWithArr = [];
                try {
                  sharedWithArr = Array.isArray(option.shared_with)
                    ? option.shared_with
                    : JSON.parse(option.shared_with);
                } catch {
                  sharedWithArr = [];
                }
                const hasSharedCount = sharedWithArr.length > 0;
                const isDependent = option.depends_on !== null;
                let label = `${option.name} (${option.phone})`;
                if (hasSharedCount) {
                  label += ' [관리횟수 공유 중]';
                } else if (isDependent) {
                  label += ' [관리횟수 의존 중]';
                }
                return label;
              }}
              value={selectedSharedMember}
              onChange={handleSharedMemberChange}
              renderInput={params => (
                <TextField {...params} size="small" placeholder="관리 횟수 연결할 회원 검색" />
              )}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sharedMembers.map(member => (
                <Chip
                  key={member.id}
                  label={member.name}
                  onDelete={() => handleRemoveSharedMember(member.id)}
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    '& .MuiChip-deleteIcon': {
                      color: '#1565c0',
                      '&:hover': {
                        color: '#0d47a1',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained">
          등록
        </Button>
      </DialogActions>
    </Dialog>
  );
});

AddMemberDialog.displayName = 'AddMemberDialog';

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
    relationship: '',
  });
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
  const [purposeStats, setPurposeStats] = useState({ diet: 0, pain: 0 });
  const [editCell, setEditCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedMember, setEditedMember] = useState({
    id: '',
    name: '',
    gender: '남',
    birth_date: '',
    purpose: '다이어트',
    phone: '',
    notes: '',
    relationship: '',
    shared_with: '[]',
  });
  const [sharedMembers, setSharedMembers] = useState([]);
  const [selectedSharedMember, setSelectedSharedMember] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // 회원 추가 모달이 열려있을 때는 필터링하지 않음
    if (openAddDialog) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(member => {
      if (!member) return false;

      const searchTermLower = searchTerm.toLowerCase();
      const nameMatch = member.name ? member.name.toLowerCase().includes(searchTermLower) : false;
      const phoneMatch = member.phone ? member.phone.includes(searchTerm) : false;
      const relationshipMatch = member.relationship
        ? member.relationship.toLowerCase().includes(searchTermLower)
        : false;

      return nameMatch || phoneMatch || relationshipMatch;
    });
    setFilteredMembers(filtered);
    setPage(0);
  }, [searchTerm, openAddDialog]);

  useEffect(() => {
    if (!searchTerm && !openAddDialog) {
      setFilteredMembers(members);
    }
  }, [members, searchTerm, openAddDialog]);

  useEffect(() => {
    if (members.length > 0) {
      // 성별 통계 계산
      const genderCount = members.reduce((acc, member) => {
        acc[member.gender] = (acc[member.gender] || 0) + 1;
        return acc;
      }, {});
      setGenderStats({
        male: genderCount['남'] || 0,
        female: genderCount['여'] || 0,
      });

      // 목적 통계 계산
      const purposeCount = members.reduce((acc, member) => {
        acc[member.purpose] = (acc[member.purpose] || 0) + 1;
        return acc;
      }, {});
      setPurposeStats({
        diet: purposeCount['다이어트'] || 0,
        pain: purposeCount['통증'] || 0,
      });
    }
  }, [members]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/members');
      if (response.data && Array.isArray(response.data)) {
        // ID를 문자열로 변환하고 모든 필드가 있는지 확인
        const membersWithStringIds = response.data
          .map(member => {
            if (!member || !member.id) {
              console.error('잘못된 회원 데이터:', member);
              return null;
            }
            return {
              ...member,
              id: String(member.id),
              name: member.name || '',
              gender: member.gender || '남',
              birth_date: member.birth_date || '',
              purpose: member.purpose || '다이어트',
              phone: member.phone || '',
              notes: member.notes || '',
              relationship: member.relationship || '',
              shared_with: member.shared_with || '[]',
            };
          })
          .filter(member => member !== null);

        console.log('가져온 회원 데이터:', membersWithStringIds);
        setMembers(membersWithStringIds);
        setFilteredMembers(membersWithStringIds);
      } else {
        console.error('회원 데이터 형식이 올바르지 않습니다:', response.data);
      }
    } catch (error) {
      console.error('회원 목록을 불러오는데 실패했습니다:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddMember = newMemberData => {
    setMembers(prev => [...prev, newMemberData]);
    if (!searchTerm) {
      setFilteredMembers(prev => [...prev, newMemberData]);
    }
    window.dispatchEvent(new Event('memberChange'));
  };

  const handleEditMember = async () => {
    try {
      const updateData = {
        name: selectedMember.name,
        gender: selectedMember.gender,
        birth_date: selectedMember.birth_date,
        purpose: selectedMember.purpose,
        phone: selectedMember.phone,
        notes: selectedMember.notes,
        relationship: selectedMember.relationship,
        shared_with: selectedMember.shared_with,
      };

      await axios.patch(`http://localhost:3001/api/members/${selectedMember.id}`, updateData);
      setOpenEditDialog(false);
      await fetchMembers();

      window.dispatchEvent(new Event('memberChange'));
    } catch (error) {
      alert('회원 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteMember = async memberId => {
    if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`http://localhost:3001/api/members/${memberId}`);
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

  const getKoreanAge = birthDateStr => {
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

  const handleInlineSave = async member => {
    try {
      const updateData = {
        name: member.name || '',
        gender: member.gender || '남',
        birth_date: member.birth_date || '',
        purpose: member.purpose || '다이어트',
        phone: member.phone || '',
        notes: member.notes || '',
        relationship: member.relationship || '',
        shared_with: member.shared_with,
        remaining_sessions: Number(editValue) || 0,
        join_date: member.join_date || new Date().toISOString().split('T')[0],
        last_visit: member.last_visit || '',
      };

      console.log('업데이트할 데이터:', updateData);
      const response = await axios.patch(
        `http://localhost:3001/api/members/${member.id}`,
        updateData
      );
      console.log('서버 응답:', response.data);

      setEditCell({ id: null, field: null });
      setEditValue('');
      await fetchMembers();
    } catch (error) {
      console.error('관리 횟수 수정 실패:', error);
      alert('관리 횟수 수정에 실패했습니다.');
    }
  };

  const handleInlineDelete = async (member, field) => {
    try {
      const newValue = field === 'remaining_sessions' ? 0 : '';
      await axios.patch(`http://localhost:3001/api/members/${member.id}`, {
        [field]: newValue,
      });

      await fetchMembers(); // 서버에서 최신 데이터를 가져옵니다
    } catch (error) {
      alert('초기화에 실패했습니다.');
    }
  };

  const handleNewMemberChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = member => {
    console.log('handleEditClick 호출 - 전달받은 회원 정보:', member);

    if (!member || !member.id) {
      console.error('회원 정보 또는 ID가 없습니다:', member);
      return;
    }

    // ID가 'null'인 경우 체크
    if (member.id === 'null') {
      console.error('회원 ID가 "null"입니다:', member);
      return;
    }

    setEditMode(true);

    // 회원 정보를 새 객체로 복사하여 설정
    const updatedMember = {
      id: member.id.toString(),
      name: member.name || '',
      gender: member.gender || '남',
      birth_date: member.birth_date || '',
      purpose: member.purpose || '다이어트',
      phone: member.phone || '',
      notes: member.notes || '',
      relationship: member.relationship || '',
      shared_with: member.shared_with || '[]',
      depends_on: member.depends_on || null,
      remaining_sessions: member.remaining_sessions || 0,
    };

    console.log('설정될 회원 정보:', updatedMember);
    setEditedMember(updatedMember);

    // 공유 중인 회원들과 의존 중인 회원들을 모두 가져옴
    const sharedIds = member.shared_with ? JSON.parse(member.shared_with) : [];
    const dependsOnId = member.depends_on;

    const sharedMembersList = members.filter(m => sharedIds.includes(m.id));
    const dependsOnMember = dependsOnId ? members.find(m => m.id === dependsOnId) : null;

    setSharedMembers([...sharedMembersList, ...(dependsOnMember ? [dependsOnMember] : [])]);
  };

  const handleSaveClick = async () => {
    try {
      console.log('저장 시작 - editedMember:', editedMember);

      if (!editedMember) {
        console.error('editedMember가 없습니다');
        alert('회원 정보가 올바르지 않습니다.');
        return;
      }

      if (!editedMember.id) {
        console.error('editedMember.id가 없습니다:', editedMember);
        alert('회원 ID가 없습니다.');
        return;
      }

      if (editedMember.id === 'null') {
        console.error('editedMember.id가 "null"입니다:', editedMember);
        alert('회원 ID가 올바르지 않습니다.');
        return;
      }

      // 현재 선택된 공유 회원들의 ID 배열
      const sharedIds = sharedMembers.map(m => m.id.toString());
      console.log('공유할 회원 ID들:', sharedIds);

      // 현재 회원의 정보 업데이트
      const updateData = {
        ...editedMember,
        shared_with: JSON.stringify(sharedIds),
        depends_on: null,
      };

      console.log('서버로 전송할 데이터:', updateData);
      const response = await axios.patch(
        `http://localhost:3001/api/members/${editedMember.id}`,
        updateData
      );
      console.log('서버 응답:', response.data);

      // 이전에 연결되어 있던 회원들 조회
      const previousSharedWith = editedMember.shared_with
        ? JSON.parse(editedMember.shared_with)
        : [];

      // 더 이상 공유되지 않는 회원들의 ID 배열
      const removedMembers = previousSharedWith.filter(id => !sharedIds.includes(id));
      console.log('제거된 회원 ID들:', removedMembers);

      // 제거된 회원들의 depends_on에서 현재 회원 ID 제거
      for (const memberId of removedMembers) {
        const member = await axios.get(`http://localhost:3001/api/members/${memberId}`);
        if (member.data) {
          const currentDependsOn = member.data.depends_on;
          if (currentDependsOn === editedMember.id) {
            await axios.patch(`http://localhost:3001/api/members/${memberId}`, {
              ...member.data,
              depends_on: null,
            });
          }
        }
      }

      // 새로 추가된 회원들의 depends_on에 현재 회원 ID 추가
      for (const memberId of sharedIds) {
        const member = await axios.get(`http://localhost:3001/api/members/${memberId}`);
        if (member.data) {
          const currentDependsOn = member.data.depends_on;
          if (currentDependsOn !== editedMember.id) {
            await axios.patch(`http://localhost:3001/api/members/${memberId}`, {
              ...member.data,
              depends_on: editedMember.id,
            });
          }
        }
      }

      setEditMode(false);
      await fetchMembers();

      // 회원 변경 이벤트 발생
      window.dispatchEvent(new Event('memberChange'));
    } catch (error) {
      console.error('회원 정보 수정에 실패했습니다:', error);
      alert('회원 정보 수정에 실패했습니다.');
    }
  };

  const handleSharedMemberChange = (event, newValue) => {
    if (newValue && !sharedMembers.find(m => m.id === newValue.id)) {
      setSharedMembers([...sharedMembers, newValue]);
    }
    setSelectedSharedMember(null);
  };

  const handleRemoveSharedMember = memberId => {
    setSharedMembers(sharedMembers.filter(m => m.id !== memberId));
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
            placeholder="전체 회원 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
              '&:hover': { background: '#e0cfc0' },
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
              <Typography variant="subtitle1" gutterBottom>
                성별 비율
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 20,
                  display: 'flex',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: 1,
                }}
              >
                <Box
                  sx={{
                    width: `${getPercentage(genderStats.male, genderStats.male + genderStats.female)}%`,
                    background: '#ffe082',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3C1E1E',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {genderStats.male > 0
                    ? `${genderStats.male} (${getPercentage(genderStats.male, genderStats.male + genderStats.female).toFixed(0)}%)`
                    : ''}
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
                    fontSize: 16,
                  }}
                >
                  {genderStats.female > 0
                    ? `${genderStats.female} (${getPercentage(genderStats.female, genderStats.male + genderStats.female).toFixed(0)}%)`
                    : ''}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#ffe082', fontWeight: 700 }}>
                  남성
                </Typography>
                <Typography variant="body2" sx={{ color: '#90caf9', fontWeight: 700 }}>
                  여성
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                목적 비율
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 20,
                  display: 'flex',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: 1,
                }}
              >
                <Box
                  sx={{
                    width: `${getPercentage(purposeStats.diet, purposeStats.diet + purposeStats.pain)}%`,
                    background: '#aed581',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3C1E1E',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {purposeStats.diet > 0
                    ? `${purposeStats.diet} (${getPercentage(purposeStats.diet, purposeStats.diet + purposeStats.pain).toFixed(0)}%)`
                    : ''}
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
                    fontSize: 16,
                  }}
                >
                  {purposeStats.pain > 0
                    ? `${purposeStats.pain} (${getPercentage(purposeStats.pain, purposeStats.diet + purposeStats.pain).toFixed(0)}%)`
                    : ''}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#aed581', fontWeight: 700 }}>
                  다이어트
                </Typography>
                <Typography variant="body2" sx={{ color: '#ce93d8', fontWeight: 700 }}>
                  통증
                </Typography>
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
              .map(member => {
                console.log('테이블 행 렌더링 - 회원 정보:', member);
                let sharedWithArr = [];
                try {
                  sharedWithArr = Array.isArray(member.shared_with)
                    ? member.shared_with
                    : JSON.parse(member.shared_with);
                } catch {
                  sharedWithArr = [];
                }
                const isDependent = members.some(m => {
                  let arr = [];
                  try {
                    arr = Array.isArray(m.shared_with) ? m.shared_with : JSON.parse(m.shared_with);
                  } catch {
                    arr = [];
                  }
                  return arr.includes(member.id);
                });
                const dependentMember = isDependent
                  ? members.find(m => m.id === member.depends_on)
                  : null;
                return (
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
                          <IconButton
                            onClick={() => handleInlineSave(member)}
                            size="small"
                            color="primary"
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton onClick={handleInlineCancel} size="small">
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {(() => {
                              // 다른 회원이 이 회원의 관리 횟수를 사용하는 경우
                              const hasSharedCount =
                                member.shared_with && JSON.parse(member.shared_with).length > 0;
                              if (hasSharedCount) {
                                return `${member.remaining_sessions}회`;
                              }
                              // 이 회원이 다른 회원의 관리 횟수를 사용하는 경우
                              const dependentId = member.depends_on;
                              if (dependentId) {
                                const sharedMember = members.find(m => m.id === dependentId);
                                if (sharedMember) {
                                  return `${sharedMember.remaining_sessions}회`;
                                }
                              }
                              return `${member.remaining_sessions}회`;
                            })()}
                          </Typography>
                          {(() => {
                            // 관리 횟수 부족 뱃지 표시 로직
                            const hasSharedCount =
                              member.shared_with && JSON.parse(member.shared_with).length > 0;
                            const isDependent = member.depends_on !== null;
                            const remainingSessions = member.remaining_sessions || 0;

                            console.log('회원 정보:', {
                              id: member.id,
                              name: member.name,
                              shared_with: member.shared_with,
                              hasSharedCount,
                              isDependent,
                              remainingSessions,
                            });

                            if (!hasSharedCount && !isDependent && remainingSessions < 3) {
                              return (
                                <Chip
                                  label="관리횟수 부족"
                                  color="warning"
                                  size="small"
                                  sx={{
                                    background: '#fff3e0',
                                    color: '#e65100',
                                    fontWeight: 600,
                                  }}
                                />
                              );
                            }
                            return null;
                          })()}
                          {sharedWithArr.length > 0 && (
                            <Chip
                              size="small"
                              label="공유 중"
                              sx={{
                                ml: 1,
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {isDependent && (
                            <Chip
                              size="small"
                              label={`의존 중: ${dependentMember ? dependentMember.name : '알 수 없음'}`}
                              sx={{
                                ml: 1,
                                background: '#e3f2fd',
                                color: '#1565c0',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          <Tooltip title="관리 횟수 수정">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleInlineEdit(
                                  member.id,
                                  'remaining_sessions',
                                  member.remaining_sessions
                                )
                              }
                              sx={{
                                color: '#3C1E1E',
                                '&:hover': {
                                  background: '#f6e7d7',
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="관리 횟수 초기화">
                            <IconButton
                              size="small"
                              onClick={() => handleInlineDelete(member, 'remaining_sessions')}
                              sx={{
                                color: '#d32f2f',
                                '&:hover': {
                                  background: '#ffebee',
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="회원 정보 수정">
                          <Button
                            onClick={() => {
                              console.log('수정 버튼 클릭 - 회원 정보:', member);
                              if (!member || !member.id) {
                                console.error('회원 정보 또는 ID가 없습니다:', member);
                                return;
                              }
                              handleEditClick({ ...member, id: member.id.toString() });
                            }}
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            sx={{
                              borderColor: '#3C1E1E',
                              color: '#3C1E1E',
                              '&:hover': {
                                borderColor: '#3C1E1E',
                                background: '#f6e7d7',
                              },
                            }}
                          >
                            수정
                          </Button>
                        </Tooltip>
                        <Tooltip title="회원 삭제">
                          <Button
                            onClick={() => handleDeleteMember(member.id)}
                            size="small"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            sx={{
                              borderColor: '#d32f2f',
                              color: '#d32f2f',
                              '&:hover': {
                                borderColor: '#d32f2f',
                                background: '#ffebee',
                              },
                            }}
                          >
                            삭제
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        members={members}
      />

      {/* 회원 수정 다이얼로그 */}
      {editMode && (
        <Dialog
          open={editMode}
          onClose={() => setEditMode(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <DialogTitle
            sx={{
              background: BROWN_BG,
              color: BROWN_TEXT,
              borderBottom: '1px solid #e0cfc0',
              '& .MuiTypography-root': {
                fontWeight: 600,
              },
            }}
          >
            회원 정보 수정
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                '& .MuiTextField-root': {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  },
                },
                '& .MuiToggleButtonGroup-root': {
                  borderRadius: 1.5,
                  overflow: 'hidden',
                },
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="이름"
                    value={editedMember.name}
                    onChange={e => setEditedMember(prev => ({ ...prev, name: e.target.value }))}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    성별
                  </Typography>
                  <ToggleButtonGroup
                    value={editedMember.gender}
                    exclusive
                    onChange={(_, v) => v && setEditedMember(prev => ({ ...prev, gender: v }))}
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value="남" sx={{ flex: 1, py: 1 }}>
                      남
                    </ToggleButton>
                    <ToggleButton value="여" sx={{ flex: 1, py: 1 }}>
                      여
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="생년월일"
                    type="date"
                    value={editedMember.birth_date}
                    onChange={e =>
                      setEditedMember(prev => ({ ...prev, birth_date: e.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    목적
                  </Typography>
                  <ToggleButtonGroup
                    value={editedMember.purpose}
                    exclusive
                    onChange={(_, v) => v && setEditedMember(prev => ({ ...prev, purpose: v }))}
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value="다이어트" sx={{ flex: 1, py: 1 }}>
                      다이어트
                    </ToggleButton>
                    <ToggleButton value="통증" sx={{ flex: 1, py: 1 }}>
                      통증
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="전화번호"
                    value={editedMember.phone}
                    onChange={e => setEditedMember(prev => ({ ...prev, phone: e.target.value }))}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="소개(관계)"
                    value={editedMember.relationship}
                    onChange={e =>
                      setEditedMember(prev => ({ ...prev, relationship: e.target.value }))
                    }
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="특이사항"
                    value={editedMember.notes}
                    onChange={e => setEditedMember(prev => ({ ...prev, notes: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    관리 횟수 연결
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Autocomplete
                      options={members.filter(
                        m => m.id !== editedMember.id && !sharedMembers.find(sm => sm.id === m.id)
                      )}
                      getOptionLabel={option => {
                        let sharedWithArr = [];
                        try {
                          sharedWithArr = Array.isArray(option.shared_with)
                            ? option.shared_with
                            : JSON.parse(option.shared_with);
                        } catch {
                          sharedWithArr = [];
                        }
                        const hasSharedCount = sharedWithArr.length > 0;
                        const isDependent = option.depends_on !== null;
                        let label = `${option.name} (${option.phone})`;
                        if (hasSharedCount) {
                          label += ' [관리횟수 공유 중]';
                        } else if (isDependent) {
                          label += ' [관리횟수 의존 중]';
                        }
                        return label;
                      }}
                      value={selectedSharedMember}
                      onChange={handleSharedMemberChange}
                      renderInput={params => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="관리 횟수 연결 대상자 검색"
                        />
                      )}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {sharedMembers.map(member => {
                        let sharedWithArr = [];
                        try {
                          sharedWithArr = Array.isArray(editedMember.shared_with)
                            ? editedMember.shared_with
                            : JSON.parse(editedMember.shared_with);
                        } catch {
                          sharedWithArr = [];
                        }
                        const isShared = sharedWithArr.includes(member.id);
                        const isDependent = editedMember.depends_on === member.id;

                        return (
                          <Chip
                            key={member.id}
                            label={`${member.name}${isShared ? ' [공유 중]' : isDependent ? ' [의존 중]' : ''}`}
                            onDelete={() => handleRemoveSharedMember(member.id)}
                            sx={{
                              backgroundColor: isShared ? '#e8f5e9' : '#e3f2fd',
                              color: isShared ? '#2e7d32' : '#1565c0',
                              '& .MuiChip-deleteIcon': {
                                color: isShared ? '#2e7d32' : '#1565c0',
                                '&:hover': {
                                  color: isShared ? '#1b5e20' : '#0d47a1',
                                },
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              background: BROWN_BG,
              borderTop: '1px solid #e0cfc0',
              p: 2,
              gap: 1,
            }}
          >
            <Button
              onClick={() => setEditMode(false)}
              variant="outlined"
              sx={{
                borderColor: BROWN_TEXT,
                color: BROWN_TEXT,
                '&:hover': {
                  borderColor: BROWN_TEXT,
                  background: '#e0cfc0',
                },
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                console.log('저장 버튼 클릭 - 현재 editedMember:', editedMember);
                if (!editedMember || !editedMember.id) {
                  console.error('저장 시도 - 회원 정보가 없습니다:', editedMember);
                  return;
                }
                handleSaveClick();
              }}
              variant="contained"
              sx={{
                background: BROWN_TEXT,
                color: '#fff',
                '&:hover': {
                  background: '#2c1810',
                },
              }}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

MemberManagement.displayName = 'MemberManagement';

export default MemberManagement;
