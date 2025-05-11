import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CalendarTest from './components/CalendarTest';
import MemberManagement from './pages/MemberManagement';
import PatchNotes from './pages/PatchNotes';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Autocomplete,
  TextField,
  IconButton,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Container from '@mui/material/Container';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import Footer from './components/Footer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FFEB00', // 카카오 옐로우
      contrastText: '#3C1E1E', // 카카오 브라운
    },
    secondary: {
      main: '#3C1E1E',
    },
    background: {
      default: '#FFFBEA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3C1E1E',
      secondary: '#7B5E57',
    },
  },
  typography: {
    fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: 2,
    },
    button: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const BROWN_BG = '#f6e7d7';
const BROWN_TEXT = '#3C1E1E';

// 만 나이 계산 함수
function getKoreanAge(birthDateStr) {
  if (!birthDateStr) return '';
  const today = new Date();
  const birth = new Date(birthDateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function App() {
  const [patients, setPatients] = useState([]);
  const [searchPatient, setSearchPatient] = useState(null);
  const [openPatientDialog, setOpenPatientDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [chargeAmount, setChargeAmount] = useState('');
  const [openChargeDialog, setOpenChargeDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
  const [editSessionId, setEditSessionId] = useState(null);
  const [editSessionDate, setEditSessionDate] = useState('');
  const [editSessionNote, setEditSessionNote] = useState('');
  const [sharedMembers, setSharedMembers] = useState([]);
  const [selectedSharedMember, setSelectedSharedMember] = useState(null);

  const handlePatientSelect = async (event, newValue) => {
    setSearchPatient(newValue);
    if (newValue) {
      setOpenPatientDialog(true);
      try {
        const memberResponse = await axios.get(`http://localhost:3001/api/members/${newValue.id}`);
        const updatedMember = memberResponse.data;
        setSearchPatient(updatedMember);

        const response = await axios.get(
          `http://localhost:3001/api/sessionHistory?memberId=${newValue.id}`
        );
        setSessionHistory(response.data);
      } catch (error) {
        console.error('회원 정보를 불러오는데 실패했습니다:', error);
        setSessionHistory([]);
      }
    }
  };

  // 회원 목록 새로고침 함수
  const refreshPatients = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/members');
      setPatients(response.data);
    } catch (error) {
      console.error('회원 데이터를 불러오는데 실패했습니다:', error);
    }
  };

  useEffect(() => {
    const handleMemberChange = () => {
      refreshPatients();
    };

    window.addEventListener('memberChange', handleMemberChange);
    return () => {
      window.removeEventListener('memberChange', handleMemberChange);
    };
  }, []);

  useEffect(() => {
    refreshPatients();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCharge = async () => {
    if (!chargeAmount || isNaN(chargeAmount) || chargeAmount <= 0) {
      alert('올바른 숫자를 입력해주세요.');
      return;
    }
    try {
      const updatedPatient = {
        ...searchPatient,
        remaining_sessions: searchPatient.remaining_sessions + Number(chargeAmount),
      };
      await axios.patch(`http://localhost:3001/api/members/${searchPatient.id}`, {
        ...searchPatient,
        remaining_sessions: updatedPatient.remaining_sessions,
      });
      setSearchPatient(updatedPatient);
      setChargeAmount('');
      setOpenChargeDialog(false);
    } catch (error) {
      console.error('관리횟수 충전에 실패했습니다:', error);
      alert('관리횟수 충전에 실패했습니다.');
    }
  };

  const handleEditClick = () => {
    setEditMode(true);
    setEditedPatient({ ...searchPatient });
    if (searchPatient.shared_with) {
      const sharedIds = JSON.parse(searchPatient.shared_with);
      const sharedMembersList = patients.filter(p => sharedIds.includes(p.id));
      setSharedMembers(sharedMembersList);
    } else {
      setSharedMembers([]);
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

  const handleSaveClick = async () => {
    try {
      // 연결된 회원들의 shared_with 필드도 업데이트
      const sharedIds = sharedMembers.map(m => m.id);

      // 현재 회원의 shared_with 업데이트
      await axios.patch(`http://localhost:3001/api/members/${searchPatient.id}`, {
        ...editedPatient,
        shared_with: JSON.stringify(sharedIds),
      });

      // 연결된 회원들의 shared_with 업데이트
      for (const memberId of sharedIds) {
        const member = patients.find(p => p.id === memberId);
        if (member) {
          const currentSharedWith = member.shared_with ? JSON.parse(member.shared_with) : [];
          if (!currentSharedWith.includes(searchPatient.id)) {
            await axios.patch(`http://localhost:3001/api/members/${memberId}`, {
              shared_with: JSON.stringify([...currentSharedWith, searchPatient.id]),
            });
          }
        }
      }

      // 이전에 연결되어 있던 회원들의 shared_with에서 현재 회원 제거
      const previousSharedWith = searchPatient.shared_with
        ? JSON.parse(searchPatient.shared_with)
        : [];
      const removedMembers = previousSharedWith.filter(id => !sharedIds.includes(id));

      for (const memberId of removedMembers) {
        const member = patients.find(p => p.id === memberId);
        if (member) {
          const currentSharedWith = JSON.parse(member.shared_with);
          await axios.patch(`http://localhost:3001/api/members/${memberId}`, {
            shared_with: JSON.stringify(currentSharedWith.filter(id => id !== searchPatient.id)),
          });
        }
      }

      // 회원 정보 업데이트 후 서버에서 최신 데이터를 다시 가져옴
      const updatedMemberResponse = await axios.get(
        `http://localhost:3001/api/members/${searchPatient.id}`
      );
      setSearchPatient(updatedMemberResponse.data);

      // 전체 회원 목록도 새로고침
      const allMembersResponse = await axios.get('http://localhost:3001/api/members');
      setPatients(allMembersResponse.data);

      setEditMode(false);

      // 회원 변경 이벤트 발생
      window.dispatchEvent(new Event('memberChange'));
    } catch (error) {
      console.error('회원 정보 수정에 실패했습니다:', error);
      alert('회원 정보 수정에 실패했습니다.');
    }
  };

  // 회원 정보 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleMemberChange = async () => {
      if (searchPatient) {
        try {
          const memberResponse = await axios.get(
            `http://localhost:3001/api/members/${searchPatient.id}`
          );
          setSearchPatient(memberResponse.data);
        } catch (error) {
          console.error('회원 정보를 불러오는데 실패했습니다:', error);
        }
      }
    };

    window.addEventListener('memberChange', handleMemberChange);
    return () => {
      window.removeEventListener('memberChange', handleMemberChange);
    };
  }, [searchPatient]);

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedPatient(null);
  };

  const handleDeleteSession = async sessionId => {
    if (!window.confirm('정말로 이 관리 내역을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/sessionHistory/${sessionId}`);
      setSessionHistory(sessionHistory.filter(h => h.id !== sessionId));
    } catch (error) {
      alert('관리 내역 삭제에 실패했습니다.');
    }
  };

  const handleEditSession = session => {
    setEditSessionId(session.id);
    const d = new Date(session.date);
    const pad = n => n.toString().padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditSessionDate(local);
    setEditSessionNote(session.note);
  };

  const handleCancelEditSession = () => {
    setEditSessionId(null);
    setEditSessionDate('');
    setEditSessionNote('');
  };

  const handleSaveEditSession = async () => {
    let isoDate = '';
    try {
      // 날짜를 항상 ISO 문자열로 변환
      isoDate = new Date(editSessionDate).toISOString();
      await axios.patch(`http://localhost:3001/api/sessionHistory/${editSessionId}`, {
        date: isoDate,
        note: editSessionNote,
      });
      // 저장 후 서버에서 다시 불러오기
      if (searchPatient) {
        const response = await axios.get(
          `http://localhost:3001/api/sessionHistory?memberId=${searchPatient.id}`
        );
        setSessionHistory(response.data);
      }
      handleCancelEditSession();
    } catch (error) {
      console.error('세션 수정에 실패했습니다.', {
        url: `http://localhost:3001/api/sessionHistory/${editSessionId}`,
        date: editSessionDate,
        isoDate,
        note: editSessionNote,
        error,
      });
      alert('세션 수정에 실패했습니다.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static" color="primary" elevation={0} sx={{ mb: 2 }}>
            <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ color: 'primary.contrastText' }}>
                  MIDAS
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <IconButton component={Link} to="/" sx={{ color: 'primary.contrastText' }}>
                  <CalendarMonthIcon />
                </IconButton>
                <IconButton component={Link} to="/members" sx={{ color: 'primary.contrastText' }}>
                  <PeopleIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/patch-notes"
                  sx={{ color: 'primary.contrastText' }}
                >
                  <TrendingUpIcon />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Autocomplete
                  options={patients}
                  getOptionLabel={option => `${option.name} (${option.phone})`}
                  value={searchPatient}
                  onChange={handlePatientSelect}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="회원 검색"
                      size="small"
                      sx={{ minWidth: 220, background: '#fff', borderRadius: 1 }}
                    />
                  )}
                  sx={{ width: 240, background: '#fff', borderRadius: 1 }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minHeight: { xs: 'auto', sm: '70vh' },
                width: '100%',
                mx: 'auto',
              }}
            >
              <Routes>
                <Route path="/" element={<CalendarTest />} />
                <Route path="/members" element={<MemberManagement />} />
                <Route path="/patch-notes" element={<PatchNotes />} />
              </Routes>
            </Box>
          </Box>
          <Footer />
          <Dialog
            open={openPatientDialog}
            onClose={() => setOpenPatientDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">회원 정보</Typography>
                <Chip label="회원" color="primary" />
              </Box>
            </DialogTitle>
            <DialogContent>
              {searchPatient && (
                <Box sx={{ mt: 2, borderRadius: 6, background: '#fff', p: 2 }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{ mb: 2, background: BROWN_BG, borderRadius: 2 }}
                    textColor="secondary"
                    indicatorColor="secondary"
                  >
                    <Tab label="회원 정보1" />
                    <Tab label="관리 내역" />
                  </Tabs>

                  {activeTab === 0 && (
                    <Box>
                      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="h6">{searchPatient.name}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              성별
                            </Typography>
                            <Typography variant="body1">{searchPatient.gender}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              생년월일
                            </Typography>
                            {editMode ? (
                              <TextField
                                type="date"
                                value={editedPatient.birth_date}
                                onChange={e =>
                                  setEditedPatient({ ...editedPatient, birth_date: e.target.value })
                                }
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            ) : (
                              <Typography variant="body1">
                                {searchPatient.birth_date} (만{' '}
                                {getKoreanAge(searchPatient.birth_date)}세)
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              목적
                            </Typography>
                            {editMode ? (
                              <ToggleButtonGroup
                                value={editedPatient.purpose}
                                exclusive
                                onChange={(_, v) =>
                                  v && setEditedPatient({ ...editedPatient, purpose: v })
                                }
                                sx={{ width: '100%' }}
                              >
                                <ToggleButton value="다이어트" sx={{ flex: 1 }}>
                                  다이어트
                                </ToggleButton>
                                <ToggleButton value="통증" sx={{ flex: 1 }}>
                                  통증
                                </ToggleButton>
                              </ToggleButtonGroup>
                            ) : (
                              <Typography variant="body1">{searchPatient.purpose}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              전화번호
                            </Typography>
                            {editMode ? (
                              <TextField
                                value={editedPatient.phone}
                                onChange={e =>
                                  setEditedPatient({ ...editedPatient, phone: e.target.value })
                                }
                                fullWidth
                                size="small"
                              />
                            ) : (
                              <Typography variant="body1">{searchPatient.phone}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              회원가입일
                            </Typography>
                            <Typography variant="body1">{searchPatient.join_date}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              최종방문일
                            </Typography>
                            <Typography variant="body1">{searchPatient.last_visit}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              소개(관계)
                            </Typography>
                            {editMode ? (
                              <TextField
                                value={editedPatient.relationship}
                                onChange={e =>
                                  setEditedPatient({
                                    ...editedPatient,
                                    relationship: e.target.value,
                                  })
                                }
                                fullWidth
                                size="small"
                              />
                            ) : (
                              <Typography variant="body1">
                                {searchPatient.relationship || '-'}
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              특이사항
                            </Typography>
                            {editMode ? (
                              <TextField
                                value={editedPatient.notes}
                                onChange={e =>
                                  setEditedPatient({ ...editedPatient, notes: e.target.value })
                                }
                                fullWidth
                                multiline
                                rows={2}
                                size="small"
                              />
                            ) : (
                              <Typography variant="body1">{searchPatient.notes || '-'}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              관리 횟수 연결
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {editMode ? (
                                <>
                                  <Autocomplete
                                    options={patients.filter(
                                      p =>
                                        p.id !== searchPatient.id &&
                                        !sharedMembers.find(m => m.id === p.id)
                                    )}
                                    getOptionLabel={option => `${option.name} (${option.phone})`}
                                    value={selectedSharedMember}
                                    onChange={handleSharedMemberChange}
                                    renderInput={params => (
                                      <TextField {...params} size="small" placeholder="회원 검색" />
                                    )}
                                  />
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {sharedMembers.map(member => {
                                      const isShared =
                                        searchPatient.shared_with &&
                                        JSON.parse(searchPatient.shared_with).includes(member.id);
                                      const isDependent =
                                        member.shared_with &&
                                        JSON.parse(member.shared_with).includes(searchPatient.id);

                                      return (
                                        <Chip
                                          key={member.id}
                                          label={`${member.name}${isShared ? '[공유 중]' : isDependent ? '[의존 중]' : ''}`}
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
                                </>
                              ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {patients
                                    .filter(p => {
                                      // 현재 회원의 shared_with에 있는 회원들
                                      const isInSharedWith =
                                        searchPatient.shared_with &&
                                        JSON.parse(searchPatient.shared_with).includes(p.id);
                                      // 현재 회원이 다른 회원의 shared_with에 있는 경우
                                      const isDependentOn =
                                        p.shared_with &&
                                        JSON.parse(p.shared_with).includes(searchPatient.id);
                                      return isInSharedWith || isDependentOn;
                                    })
                                    .map(member => {
                                      const isShared =
                                        searchPatient.shared_with &&
                                        JSON.parse(searchPatient.shared_with).includes(member.id);
                                      const isDependent =
                                        member.shared_with &&
                                        JSON.parse(member.shared_with).includes(searchPatient.id);

                                      return (
                                        <Chip
                                          key={member.id}
                                          label={`${member.name}${isShared ? '[공유 중]' : isDependent ? '[의존 중]' : ''}`}
                                          sx={{
                                            backgroundColor: isShared ? '#e8f5e9' : '#e3f2fd',
                                            color: isShared ? '#2e7d32' : '#1565c0',
                                          }}
                                        />
                                      );
                                    })}
                                </Box>
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              남은 관리횟수
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {(() => {
                                // 의존 중인 대상 찾기
                                const dependentMember = patients.find(
                                  p =>
                                    p.shared_with &&
                                    JSON.parse(p.shared_with).includes(searchPatient.id)
                                );

                                // 의존 중인 대상이 있으면 그 대상의 횟수를, 없으면 자신의 횟수를 표시
                                const remainingSessions = dependentMember
                                  ? dependentMember.remaining_sessions
                                  : searchPatient.remaining_sessions;
                                const isDependent = !!dependentMember;

                                return (
                                  <>
                                    <Typography variant="body1">
                                      {remainingSessions}회
                                      {isDependent && ` (${dependentMember.name}님의 횟수)`}
                                    </Typography>
                                    {remainingSessions < 3 && (
                                      <Tooltip
                                        title="관리횟수가 부족합니다. 충전이 필요합니다."
                                        arrow
                                      >
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
                                      </Tooltip>
                                    )}
                                    {!isDependent && (
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setOpenChargeDialog(true)}
                                        sx={{
                                          background: BROWN_BG,
                                          color: BROWN_TEXT,
                                          borderColor: BROWN_TEXT,
                                          '&:hover': {
                                            background: '#e0cfc0',
                                            borderColor: BROWN_TEXT,
                                          },
                                        }}
                                      >
                                        충전
                                      </Button>
                                    )}
                                  </>
                                );
                              })()}
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}
                            >
                              {editMode ? (
                                <>
                                  <Button
                                    onClick={handleCancelEdit}
                                    variant="outlined"
                                    sx={{
                                      background: BROWN_BG,
                                      color: BROWN_TEXT,
                                      borderColor: BROWN_TEXT,
                                      '&:hover': {
                                        background: '#e0cfc0',
                                        borderColor: BROWN_TEXT,
                                      },
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    onClick={handleSaveClick}
                                    variant="contained"
                                    sx={{
                                      background: BROWN_BG,
                                      color: BROWN_TEXT,
                                      '&:hover': {
                                        background: '#e0cfc0',
                                      },
                                    }}
                                  >
                                    저장
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={handleEditClick}
                                  variant="outlined"
                                  sx={{
                                    background: BROWN_BG,
                                    color: BROWN_TEXT,
                                    borderColor: BROWN_TEXT,
                                    '&:hover': {
                                      background: '#e0cfc0',
                                      borderColor: BROWN_TEXT,
                                    },
                                  }}
                                >
                                  수정
                                </Button>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Box>
                  )}

                  {activeTab === 1 && (
                    <Box>
                      {sessionHistory.map((history, index) => (
                        <Paper
                          key={history.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          {editSessionId === history.id ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
                              <TextField
                                type="datetime-local"
                                value={editSessionDate}
                                onChange={e => setEditSessionDate(e.target.value)}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                              <TextField
                                value={editSessionNote}
                                onChange={e => setEditSessionNote(e.target.value)}
                                size="small"
                                multiline
                                minRows={1}
                                maxRows={3}
                              />
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                {new Date(history.date).toLocaleString('ko-KR')}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {history.note}
                              </Typography>
                            </Box>
                          )}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 1,
                              ml: 2,
                            }}
                          >
                            {editSessionId === history.id ? (
                              <>
                                <Tooltip title="저장" placement="right">
                                  <IconButton
                                    onClick={handleSaveEditSession}
                                    sx={{
                                      color: '#3C1E1E',
                                      '&:hover': {
                                        background: '#f6e7d7',
                                      },
                                    }}
                                  >
                                    <SaveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="취소" placement="right">
                                  <IconButton
                                    onClick={handleCancelEditSession}
                                    sx={{
                                      color: '#3C1E1E',
                                      '&:hover': {
                                        background: '#f6e7d7',
                                      },
                                    }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip title="수정" placement="right">
                                  <IconButton
                                    onClick={() => handleEditSession(history)}
                                    sx={{
                                      color: '#3C1E1E',
                                      '&:hover': {
                                        background: '#f6e7d7',
                                      },
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="삭제" placement="right">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDeleteSession(history.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                background: BROWN_BG,
              }}
            >
              <Button
                onClick={() => setOpenPatientDialog(false)}
                sx={{
                  background: BROWN_BG,
                  color: BROWN_TEXT,
                  '&:hover': { background: '#e0cfc0' },
                }}
              >
                닫기
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={openChargeDialog}
            onClose={() => setOpenChargeDialog(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>관리횟수 충전</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="충전할 횟수"
                  type="number"
                  value={chargeAmount}
                  onChange={e => setChargeAmount(e.target.value)}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ background: BROWN_BG }}>
              <Button
                onClick={() => setOpenChargeDialog(false)}
                sx={{
                  background: BROWN_BG,
                  color: BROWN_TEXT,
                  '&:hover': { background: '#e0cfc0' },
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleCharge}
                variant="contained"
                sx={{
                  background: BROWN_BG,
                  color: BROWN_TEXT,
                  '&:hover': { background: '#e0cfc0' },
                }}
              >
                충전
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
