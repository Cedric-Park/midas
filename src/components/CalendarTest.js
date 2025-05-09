import React, { useState, useEffect } from 'react';
import Calendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Box, Typography, Paper, Grid, TextareaAutosize, Chip, Tabs, Tab, Divider, Snackbar, Alert, Card, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, InputAdornment } from '@mui/material';
import axios from 'axios';
import { ko } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import './CalendarTest.css';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

const DISABLED_COLOR = '#bdbdbd';
const BROWN_BG = '#f6e7d7';
const BROWN_TEXT = '#3C1E1E';

const CalendarTest = () => {
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [members, setMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventMember, setEventMember] = useState(null);
  const [treatmentNote, setTreatmentNote] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [dayHeaderFormat, setDayHeaderFormat] = useState({
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    omitCommas: true
  });
  const [newMember, setNewMember] = useState({
    name: '',
    gender: '남',
    birthDate: '',
    purpose: '다이어트',
    phone: '',
    remainCount: 12,
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [weeklyTop, setWeeklyTop] = useState([]);
  const [monthlyTop, setMonthlyTop] = useState([]);
  const [rankingTab, setRankingTab] = useState(0);

  useEffect(() => {
    // 회원 데이터 로드
    const loadMembers = async () => {
      try {
        const response = await axios.get('http://localhost:3001/members');
        console.log('서버 응답:', response);
        if (response.data && Array.isArray(response.data)) {
          console.log('받아온 회원 데이터:', response.data);
          setMembers(response.data);
        } else {
          console.error('회원 데이터 형식이 올바르지 않습니다:', response.data);
        }
      } catch (error) {
        console.error('회원 데이터를 불러오는데 실패했습니다:', error);
        if (error.response) {
          console.error('서버 응답:', error.response.data);
          console.error('상태 코드:', error.response.status);
        }
      }
    };
    loadMembers();
  }, []);

  useEffect(() => {
    // 예약 데이터 로드
    axios.get('http://localhost:3001/appointments')
      .then(response => {
        setAppointments(response.data);
      })
      .catch(error => {
        console.error('예약 데이터를 불러오는데 실패했습니다:', error);
      });
  }, []);

  useEffect(() => {
    if (appointments.length === 0 || members.length === 0) return;
    const formattedEvents = appointments
      .filter(appointment => appointment.start && appointment.end)
      .map(appointment => {
        const member = members.find(m => String(m.id) === String(appointment.memberId));
        let eventStyle = {
          classNames: ['midas-event'],
          backgroundColor: '#f6e7d7',
          borderColor: '#a67c52',
          textColor: '#3C1E1E'
        };

        if (appointment.status === 'completed') {
          eventStyle = {
            classNames: ['midas-event', 'midas-event-completed'],
            backgroundColor: '#bdbdbd',
            borderColor: '#757575',
            textColor: '#212121'
          };
        } else if (appointment.status === 'cancelled') {
          eventStyle = {
            classNames: ['midas-event', 'midas-event-cancelled'],
            backgroundColor: '#ffcdd2',
            borderColor: '#e57373',
            textColor: '#b71c1c'
          };
        }

        return {
          id: appointment.id,
          title: member ? member.name : 'Unknown Member',
          start: appointment.start,
          end: appointment.end,
          memberId: appointment.memberId,
          status: appointment.status,
          ...eventStyle
        };
      });
    console.log('캘린더에 표시될 events:', formattedEvents);
    setEvents(formattedEvents);
  }, [appointments, members]);

  useEffect(() => {
    if (members.length === 0) return;
    const fetchAllSessionHistory = async () => {
      try {
        const allHistory = await Promise.all(
          members.map(member =>
            axios.get(`http://localhost:3001/sessionHistory?memberId=${member.id}`)
              .then(res => ({ member, history: res.data }))
          )
        );
        const now = new Date();
        // 최근 7일/30일 내 세션 개수 집계
        const weekly = allHistory.map(({ member, history }) => ({
          member,
          count: history.filter(h => (now - new Date(h.date)) / (1000*60*60*24) <= 7).length
        })).filter(item => item.count > 0);
        const monthly = allHistory.map(({ member, history }) => ({
          member,
          count: history.filter(h => (now - new Date(h.date)) / (1000*60*60*24) <= 30).length
        })).filter(item => item.count > 0);
        // 내림차순 정렬 후 Top 10
        setWeeklyTop(weekly.sort((a, b) => b.count - a.count).slice(0, 10));
        setMonthlyTop(monthly.sort((a, b) => b.count - a.count).slice(0, 10));
      } catch (error) {
        console.error('세션 통계 집계 실패:', error);
      }
    };
    fetchAllSessionHistory();
  }, [members, appointments]);

  const loadSessionHistory = async (memberId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sessionHistory?memberId=${memberId}`);
      console.log('받아온 세션 내역:', response.data);
      setSessionHistory(response.data);
    } catch (error) {
      console.error('세션 내역을 불러오는데 실패했습니다:', error);
    }
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedTime(selectInfo);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
  };

  const handleConfirmReservation = () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }
    const newAppointment = {
      memberId: selectedMember.id,
      start: selectedTime.startStr,
      end: selectedTime.endStr,
      status: 'scheduled'
    };
    axios.post('http://localhost:3001/appointments', newAppointment)
      .then(response => {
        setAppointments([...appointments, response.data]);
        handleCloseDialog();
      })
      .catch(error => {
        console.error('예약 생성에 실패했습니다:', error);
      });
  };

  const handleEventClick = async (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setEventMember(null);
    try {
      const memberId = clickInfo.event.extendedProps.memberId;
      if (!memberId) {
        console.error('회원 ID가 없습니다.');
        return;
      }
      const response = await axios.get(`http://localhost:3001/members/${memberId}`);
      console.log('클릭한 회원 정보:', response.data);
      if (response.data) {
        setEventMember(response.data);
        await loadSessionHistory(memberId);
      } else {
        console.error('회원 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('회원 정보를 불러오는데 실패했습니다:', error);
    }
  };

  const handleCompleteTreatment = () => {
    if (!treatmentNote) {
      alert('세션 내용을 입력해주세요.');
      return;
    }

    const newSessionHistory = {
      memberId: selectedEvent.extendedProps.memberId,
      date: new Date().toISOString(),
      note: treatmentNote
    };

    axios.post('http://localhost:3001/sessionHistory', newSessionHistory)
      .then(() => {
        // 예약 상태를 completed로 변경
        return axios.patch(`http://localhost:3001/appointments/${selectedEvent.id}`, {
          status: 'completed'
        });
      })
      .then(() => {
        // 세션 종료 시 회원 lastVisit도 오늘 날짜로 PATCH
        const todayStr = new Date().toISOString().split('T')[0];
        return axios.patch(`http://localhost:3001/members/${selectedEvent.extendedProps.memberId}`, { 
          last_visit: todayStr,
          remaining_sessions: eventMember.remaining_sessions - 1
        });
      })
      .then(() => {
        // 세션 내역 목록 다시 불러오기
        return loadSessionHistory(selectedEvent.extendedProps.memberId);
      })
      .then(() => {
        setAppointments(appointments.map(app =>
          String(app.id) === String(selectedEvent.id) ? { ...app, status: 'completed' } : app
        ));
        setTreatmentNote('');
        setToastOpen(true);
        handleCloseEventDialog();
      })
      .catch(error => {
        console.error('세션 내역 저장에 실패했습니다:', error);
        alert('세션 내역 저장에 실패했습니다. 다시 시도해주세요.');
      });
  };

  const handleCancelReservation = () => {
    if (window.confirm('정말로 이 예약을 취소하시겠습니까?')) {
      const appointmentId = String(selectedEvent.id);
      // 관리 완료된 예약인지 확인
      if (selectedEvent.extendedProps.status === 'completed') {
        alert('이미 관리가 완료된 예약은 취소할 수 없습니다.');
        return;
      }
      // 예약 삭제
      axios.delete(`http://localhost:3001/appointments/${appointmentId}`)
        .then(() => {
          // 예약 목록을 서버에서 다시 불러와 갱신
          axios.get('http://localhost:3001/appointments')
            .then(response => {
              setAppointments(response.data);
              // appointments 갱신 후 events도 즉시 갱신
              if (members.length > 0) {
                const formattedEvents = response.data
                  .filter(appointment => appointment.start && appointment.end)
                  .map(appointment => {
                    const member = members.find(m => String(m.id) === String(appointment.memberId));
                    let eventStyle = {
                      classNames: ['midas-event'],
                      backgroundColor: '#f6e7d7',
                      borderColor: '#a67c52',
                      textColor: '#3C1E1E'
                    };
                    if (appointment.status === 'completed') {
                      eventStyle = {
                        classNames: ['midas-event', 'midas-event-completed'],
                        backgroundColor: '#bdbdbd',
                        borderColor: '#757575',
                        textColor: '#212121'
                      };
                    } else if (appointment.status === 'cancelled') {
                      eventStyle = {
                        classNames: ['midas-event', 'midas-event-cancelled'],
                        backgroundColor: '#ffcdd2',
                        borderColor: '#e57373',
                        textColor: '#b71c1c'
                      };
                    }
                    return {
                      id: appointment.id,
                      title: member ? member.name : 'Unknown Member',
                      start: appointment.start,
                      end: appointment.end,
                      memberId: appointment.memberId,
                      status: appointment.status,
                      ...eventStyle
                    };
                  });
                setEvents(formattedEvents);
              }
              setSelectedEvent(null);
              setEventMember(null);
            });
        })
        .catch(error => {
          console.error('예약 취소에 실패했습니다:', error);
          alert('예약 취소에 실패했습니다. 다시 시도해주세요.');
        });
    }
  };

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

  const handleCloseEventDialog = () => {
    setSelectedEvent(null);
    setEventMember(null);
    setTreatmentNote('');
    setNextVisit('');
    setSessionHistory([]);
    setActiveTab(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewMember({ name: '', gender: '남', birthDate: '', purpose: '다이어트', phone: '', remainCount: 12, notes: '' });
  };
  const handleAddMember = () => {
    if (!newMember.name || !newMember.birthDate || !newMember.phone) {
      alert('이름, 생년월일, 전화번호는 필수입니다.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    axios.post('http://localhost:3001/members', {
      ...newMember,
      birth_date: newMember.birthDate,
      join_date: today,
      last_visit: '',
      notes: newMember.notes || '',
      remaining_sessions: newMember.remainCount,
      birthDate: undefined,
      remainCount: undefined
    }).then(res => {
      setMembers([...members, res.data]);
      handleCloseAddDialog();
      // 회원 목록 갱신
      axios.get('http://localhost:3001/members')
        .then(response => {
          setMembers(response.data);
        })
        .catch(error => {
          console.error('회원 목록 갱신 실패:', error);
        });
    }).catch(() => {
      alert('회원 등록에 실패했습니다.');
    });
  };

  const handleViewDidMount = (view) => {
    setCurrentView(view.type);
    if (view.type === 'dayGridMonth') {
      setDayHeaderFormat({ month: 'long' });
    } else {
      setDayHeaderFormat({
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
        omitCommas: true
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, width: '100%', maxWidth: 1200, mx: 'auto', mt: 4 }}>
      {/* 좌측 통계 랭킹 (카드 바깥 별도 영역) */}
      <Box sx={{ minWidth: 260, maxWidth: 300, flex: '0 0 260px', background: '#fffbe8', borderRadius: 2, p: 2, boxShadow: 1, height: 'fit-content' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LeaderboardIcon sx={{ color: BROWN_TEXT, mr: 1 }} />
          <Typography variant="h6" sx={{ color: BROWN_TEXT }}>방문 랭킹</Typography>
        </Box>
        <Tabs value={rankingTab} onChange={(_, v) => setRankingTab(v)} sx={{ mb: 1 }} textColor="secondary" indicatorColor="secondary">
          <Tab label="최근 1주" />
          <Tab label="최근 1개월" />
        </Tabs>
        {rankingTab === 0 ? (
          <Box>
            {weeklyTop.length === 0 ? (
              <Typography variant="body2" color="text.secondary">데이터 없음</Typography>
            ) : (
              weeklyTop.map((item, idx) => (
                <Box key={item.member.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip label={`#${idx+1}`} size="small" sx={{ mr: 1, background: '#ffe082', color: BROWN_TEXT, fontWeight: 700 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>{item.member.name}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.count}회</Typography>
                </Box>
              ))
            )}
          </Box>
        ) : (
          <Box>
            {monthlyTop.length === 0 ? (
              <Typography variant="body2" color="text.secondary">데이터 없음</Typography>
            ) : (
              monthlyTop.map((item, idx) => (
                <Box key={item.member.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip label={`#${idx+1}`} size="small" sx={{ mr: 1, background: '#aed581', color: BROWN_TEXT, fontWeight: 700 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>{item.member.name}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.count}회</Typography>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>
      {/* 우측 예약현황 카드 */}
      <Card sx={{ flex: 1, minWidth: 0, maxWidth: 900, p: 3, boxShadow: 2, borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon sx={{ color: BROWN_TEXT }} />
            <Typography variant="h5">예약 현황</Typography>
          </Box>
        </Box>
        <Calendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          selectAllow={() => true}
          editable={true}
          droppable={true}
          allDaySlot={false}
          displayEventTime={false}
          height="auto"
          locale="ko"
          firstDay={0}
          buttonText={{
            today: '오늘',
            month: '월간',
            week: '주간',
            day: '일간',
            list: '목록'
          }}
          eventContent={(arg) => {
            const isCompleted = arg.event.extendedProps.status === 'completed';
            const style = isCompleted
              ? {
                  background: '#bdbdbd',
                  borderLeft: '2.5px solid #757575',
                  color: '#212121',
                  opacity: 1,
                  padding: '2px 4px',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }
              : {};
            return (
              <div style={style}>
                {arg.event.title}
              </div>
            );
          }}
          eventClassNames={(arg) => {
            const isCompleted = arg.event.extendedProps.status === 'completed';
            return isCompleted ? ['midas-event', 'midas-event-completed'] : ['midas-event'];
          }}
        />
        
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>예약하기</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                options={members}
                getOptionLabel={(option) => `${option.name} (${option.phone})`}
                value={selectedMember}
                onChange={(event, newValue) => {
                  setSelectedMember(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="회원 선택"
                    fullWidth
                    required
                    autoFocus
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.phone} | {option.purpose} | {option.gender} | {option.birth_date}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>취소</Button>
            <Button onClick={handleConfirmReservation} variant="contained" color="primary">
              예약하기
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(selectedEvent)} onClose={handleCloseEventDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">예약 상세 정보</Typography>
              <IconButton
                aria-label="close"
                onClick={handleCloseEventDialog}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {eventMember && (
              <Box sx={{ mt: 2, borderRadius: 6, background: '#fff', p: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, background: BROWN_BG, borderRadius: 2 }} textColor="secondary" indicatorColor="secondary">
                  <Tab label="회원 정보" />
                  <Tab label="관리 내역" />
                </Tabs>

                {activeTab === 0 && (
                  <Box>
                    <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="h6">{eventMember.name}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">성별</Typography>
                          <Typography variant="body1">{eventMember.gender}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">생년월일</Typography>
                          <Typography variant="body1">{eventMember.birth_date} (만 {getKoreanAge(eventMember.birth_date)}세)</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">목적</Typography>
                          <Typography variant="body1">{eventMember.purpose}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">전화번호</Typography>
                          <Typography variant="body1">{eventMember.phone}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">회원가입일</Typography>
                          <Typography variant="body1">{eventMember.join_date}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">최종방문일</Typography>
                          <Typography variant="body1">{eventMember.last_visit}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">특이사항</Typography>
                          <Typography variant="body1">{eventMember.notes || eventMember.relationship}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">남은 관리횟수</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{eventMember.remaining_sessions}회</Typography>
                            {eventMember.remaining_sessions < 3 && (
                              <Tooltip title="관리횟수가 부족합니다. 충전이 필요합니다." arrow>
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
                              </Tooltip>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      세션 내역
                    </Typography>
                    {sessionHistory && sessionHistory.length > 0 ? (
                      <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {sessionHistory.map((history, index) => (
                          <Paper key={history.id} elevation={0} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                              {new Date(history.date).toLocaleString('ko-KR')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {history.note}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        세션 내역이 없습니다.
                      </Typography>
                    )}

                    {selectedEvent && selectedEvent.extendedProps.status !== 'completed' && (
                      <Box mt={3}>
                        <Typography variant="h6" gutterBottom>
                          새로운 세션 내역
                        </Typography>
                        <TextareaAutosize
                          minRows={4}
                          placeholder="세션 내용을 입력하세요..."
                          value={treatmentNote}
                          onChange={(e) => setTreatmentNote(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '16px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                          }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleCompleteTreatment}
                          disabled={!treatmentNote}
                          sx={{ 
                            background: BROWN_BG, 
                            color: BROWN_TEXT, 
                            '&:hover': { background: '#e0cfc0' } 
                          }}
                        >
                          세션 완료
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 1, background: BROWN_BG }}>
            {selectedEvent && selectedEvent.extendedProps.status !== 'completed' && (
              <Button 
                onClick={handleCancelReservation} 
                color="error"
                sx={{ 
                  background: BROWN_BG, 
                  color: BROWN_TEXT, 
                  '&:hover': { background: '#e0cfc0' } 
                }}
              >
                예약 취소
              </Button>
            )}
            <Button 
              onClick={handleCloseEventDialog}
              sx={{ 
                background: BROWN_BG, 
                color: BROWN_TEXT, 
                '&:hover': { background: '#e0cfc0' } 
              }}
            >
              닫기
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={toastOpen}
          autoHideDuration={2500}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: '100%' }}>
            관리가 완료되었습니다.
          </Alert>
        </Snackbar>
        <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="xs" fullWidth>
          <DialogTitle>회원 등록</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="이름" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} fullWidth required />
              <ToggleButtonGroup
                value={newMember.gender}
                exclusive
                onChange={(_, v) => v && setNewMember({ ...newMember, gender: v })}
                sx={{ width: '100%' }}
              >
                <ToggleButton value="남" sx={{ flex: 1 }}>남</ToggleButton>
                <ToggleButton value="여" sx={{ flex: 1 }}>여</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                label="생년월일"
                type="date"
                value={newMember.birthDate}
                onChange={e => setNewMember({ ...newMember, birthDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <ToggleButtonGroup
                value={newMember.purpose}
                exclusive
                onChange={(_, v) => v && setNewMember({ ...newMember, purpose: v })}
                sx={{ width: '100%' }}
              >
                <ToggleButton value="다이어트" sx={{ flex: 1 }}>다이어트</ToggleButton>
                <ToggleButton value="통증" sx={{ flex: 1 }}>통증</ToggleButton>
              </ToggleButtonGroup>
              <TextField label="전화번호" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} fullWidth required />
              <TextField label="남은 관리횟수" type="number" value={newMember.remainCount} onChange={e => setNewMember({ ...newMember, remainCount: Number(e.target.value) })} fullWidth />
              <TextField label="특이사항" value={newMember.notes} onChange={e => setNewMember({ ...newMember, notes: e.target.value })} fullWidth multiline minRows={2} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>취소</Button>
            <Button onClick={handleAddMember} variant="contained" color="primary">등록</Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Box>
  );
};

export default CalendarTest;
