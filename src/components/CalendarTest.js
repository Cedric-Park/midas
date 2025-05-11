import React, { useState, useEffect } from 'react';
import Calendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Paper,
  Grid,
  TextareaAutosize,
  Chip,
  Tabs,
  Tab,
  Divider,
  Snackbar,
  Alert,
  Card,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import axios from 'axios';
import { ko } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import './CalendarTest.css';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import DeleteIcon from '@mui/icons-material/Delete';

const DISABLED_COLOR = '#bdbdbd';
const BROWN_BG = '#f6e7d7';
const BROWN_TEXT = '#3C1E1E';

const CalendarTest = () => {
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [members, setMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEventDialog, setOpenEventDialog] = useState(false);
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
    omitCommas: true,
  });
  const [newMember, setNewMember] = useState({
    name: '',
    gender: '남',
    birthDate: '',
    purpose: '다이어트',
    phone: '',
    remainCount: 12,
    notes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [weeklyTop, setWeeklyTop] = useState([]);
  const [monthlyTop, setMonthlyTop] = useState([]);
  const [rankingTab, setRankingTab] = useState(0);

  useEffect(() => {
    // 회원 데이터 로드
    const loadMembers = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/members');
        if (response.data && Array.isArray(response.data)) {
          setMembers(response.data);
        }
      } catch (error) {
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
    axios
      .get('http://localhost:3001/api/appointments')
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
          textColor: '#3C1E1E',
        };

        if (appointment.status === 'completed') {
          eventStyle = {
            classNames: ['midas-event', 'midas-event-completed'],
            backgroundColor: '#bdbdbd',
            borderColor: '#757575',
            textColor: '#212121',
          };
        } else if (appointment.status === 'cancelled') {
          eventStyle = {
            classNames: ['midas-event', 'midas-event-cancelled'],
            backgroundColor: '#ffcdd2',
            borderColor: '#e57373',
            textColor: '#b71c1c',
          };
        }

        return {
          id: appointment.id,
          title: member ? member.name : 'Unknown Member',
          start: appointment.start,
          end: appointment.end,
          memberId: appointment.memberId,
          status: appointment.status,
          ...eventStyle,
        };
      });
    setEvents(formattedEvents);
  }, [appointments, members]);

  useEffect(() => {
    if (members.length === 0) return;

    const fetchAllSessionHistory = async () => {
      try {
        // 최근 30일 데이터만 가져오도록 수정
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        // 병렬 요청 제한
        const batchSize = 5;
        const allHistory = [];

        for (let i = 0; i < members.length; i += batchSize) {
          const batch = members.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(member =>
              axios
                .get(
                  `http://localhost:3001/api/sessionHistory?memberId=${member.id}&startDate=${thirtyDaysAgoStr}`
                )
                .then(res => ({ member, history: res.data }))
                .catch(error => {
                  console.error(`회원 ${member.id}의 세션 내역 조회 실패:`, error);
                  return { member, history: [] };
                })
            )
          );
          allHistory.push(...batchResults);

          // 각 배치 사이에 약간의 지연 추가
          if (i + batchSize < members.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        const now = new Date();
        // 최근 7일/30일 내 세션 개수 집계
        const weekly = allHistory
          .map(({ member, history }) => ({
            member,
            count: history.filter(h => (now - new Date(h.date)) / (1000 * 60 * 60 * 24) <= 7)
              .length,
          }))
          .filter(item => item.count > 0);

        const monthly = allHistory
          .map(({ member, history }) => ({
            member,
            count: history.filter(h => (now - new Date(h.date)) / (1000 * 60 * 60 * 24) <= 30)
              .length,
          }))
          .filter(item => item.count > 0);

        // 내림차순 정렬 후 Top 10
        setWeeklyTop(weekly.sort((a, b) => b.count - a.count).slice(0, 10));
        setMonthlyTop(monthly.sort((a, b) => b.count - a.count).slice(0, 10));
      } catch (error) {
        console.error('세션 통계 집계 실패:', error);
      }
    };

    // 디바운스 처리
    const timeoutId = setTimeout(fetchAllSessionHistory, 1000);
    return () => clearTimeout(timeoutId);
  }, [members, appointments]);

  const loadSessionHistory = async memberId => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/sessionHistory?memberId=${memberId}`
      );
      console.log('받아온 세션 내역:', response.data);
      setSessionHistory(response.data);
    } catch (error) {
      console.error('세션 내역을 불러오는데 실패했습니다:', error);
    }
  };

  const handleDateSelect = selectInfo => {
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
      status: 'scheduled',
    };
    axios
      .post('http://localhost:3001/api/appointments', newAppointment)
      .then(response => {
        // 예약 생성 후, appointments 목록을 다시 불러와 갱신
        return axios.get('http://localhost:3001/api/appointments');
      })
      .then(response => {
        setAppointments(response.data);
        // events도 즉시 갱신
        if (members.length > 0) {
          const formattedEvents = response.data
            .filter(appointment => appointment.start && appointment.end)
            .map(appointment => {
              const member = members.find(m => String(m.id) === String(appointment.memberId));
              let eventStyle = {
                classNames: ['midas-event'],
                backgroundColor: '#f6e7d7',
                borderColor: '#a67c52',
                textColor: '#3C1E1E',
              };
              if (appointment.status === 'completed') {
                eventStyle = {
                  classNames: ['midas-event', 'midas-event-completed'],
                  backgroundColor: '#bdbdbd',
                  borderColor: '#757575',
                  textColor: '#212121',
                };
              } else if (appointment.status === 'cancelled') {
                eventStyle = {
                  classNames: ['midas-event', 'midas-event-cancelled'],
                  backgroundColor: '#ffcdd2',
                  borderColor: '#e57373',
                  textColor: '#b71c1c',
                };
              }
              return {
                id: appointment.id,
                title: member ? member.name : 'Unknown Member',
                start: appointment.start,
                end: appointment.end,
                memberId: appointment.memberId,
                status: appointment.status,
                ...eventStyle,
              };
            });
          setEvents(formattedEvents);
        }
        handleCloseDialog();
      })
      .catch(error => {
        console.error('예약 생성에 실패했습니다:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert(error.response.data.error);
        } else {
          alert('예약 생성에 실패했습니다. 다시 시도해주세요.');
        }
      });
  };

  const handleEventClick = async clickInfo => {
    const event = clickInfo.event;
    const memberId = event.extendedProps.memberId;

    try {
      // 회원 정보를 다시 불러옵니다
      const updatedMemberResponse = await axios.get(
        `http://localhost:3001/api/members/${memberId}`
      );
      const member = updatedMemberResponse.data;

      setSelectedEvent({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        memberId: memberId,
        member: member,
        status: event.extendedProps.status,
      });
      setEventMember(member);
      await loadSessionHistory(memberId);
      setOpenEventDialog(true);
    } catch (error) {
      console.error('회원 정보를 불러오는데 실패했습니다:', error);
    }
  };

  // 회원 정보 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleMemberChange = async () => {
      if (eventMember) {
        try {
          const memberResponse = await axios.get(
            `http://localhost:3001/api/members/${eventMember.id}`
          );
          setEventMember(memberResponse.data);
        } catch (error) {
          console.error('회원 정보를 불러오는데 실패했습니다:', error);
        }
      }
    };

    window.addEventListener('memberChange', handleMemberChange);
    return () => {
      window.removeEventListener('memberChange', handleMemberChange);
    };
  }, [eventMember]);

  const handleCompleteTreatment = () => {
    if (!treatmentNote) {
      alert('세션 내용을 입력해주세요.');
      return;
    }

    if (!selectedEvent || !eventMember) {
      alert('회원 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
      return;
    }

    const newSessionHistory = {
      memberId: selectedEvent.memberId,
      date: selectedEvent.start,
      note: treatmentNote,
    };

    axios
      .post('http://localhost:3001/api/sessionHistory', newSessionHistory)
      .then(response => {
        return axios.patch(`http://localhost:3001/api/appointments/${selectedEvent.id}`, {
          status: 'completed',
          memberId: selectedEvent.memberId,
          start: selectedEvent.start,
          end: selectedEvent.end,
        });
      })
      .then(response => {
        return axios.get('http://localhost:3001/api/appointments');
      })
      .then(response => {
        setAppointments(response.data);
        if (members.length > 0) {
          const formattedEvents = response.data
            .filter(appointment => appointment.start && appointment.end)
            .map(appointment => {
              const member = members.find(m => String(m.id) === String(appointment.memberId));
              let eventStyle = {
                classNames: ['midas-event'],
                backgroundColor: '#f6e7d7',
                borderColor: '#a67c52',
                textColor: '#3C1E1E',
              };
              if (appointment.status === 'completed') {
                eventStyle = {
                  classNames: ['midas-event', 'midas-event-completed'],
                  backgroundColor: '#bdbdbd',
                  borderColor: '#757575',
                  textColor: '#212121',
                };
              } else if (appointment.status === 'cancelled') {
                eventStyle = {
                  classNames: ['midas-event', 'midas-event-cancelled'],
                  backgroundColor: '#ffcdd2',
                  borderColor: '#e57373',
                  textColor: '#b71c1c',
                };
              }
              return {
                id: appointment.id,
                title: member ? member.name : 'Unknown Member',
                start: appointment.start,
                end: appointment.end,
                memberId: appointment.memberId,
                status: appointment.status,
                ...eventStyle,
              };
            });
          setEvents(formattedEvents);
        }
        handleCloseDialog();
      })
      .catch(error => {
        if (error.response && error.response.data && error.response.data.error) {
          alert(error.response.data.error);
        } else {
          alert('예약 생성에 실패했습니다. 다시 시도해주세요.');
        }
      });
  };

  const handleCancelReservation = () => {
    if (window.confirm('정말로 이 예약을 취소하시겠습니까?')) {
      const appointmentId = String(selectedEvent.id);
      // 관리 완료된 예약인지 확인
      if (selectedEvent.status === 'completed') {
        alert('이미 관리가 완료된 예약은 취소할 수 없습니다.');
        return;
      }
      // 예약 삭제
      axios
        .delete(`http://localhost:3001/api/appointments/${appointmentId}`)
        .then(() => {
          // 예약 목록을 서버에서 다시 불러와 갱신
          return axios.get('http://localhost:3001/api/appointments');
        })
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
                  textColor: '#3C1E1E',
                };
                if (appointment.status === 'completed') {
                  eventStyle = {
                    classNames: ['midas-event', 'midas-event-completed'],
                    backgroundColor: '#bdbdbd',
                    borderColor: '#757575',
                    textColor: '#212121',
                  };
                } else if (appointment.status === 'cancelled') {
                  eventStyle = {
                    classNames: ['midas-event', 'midas-event-cancelled'],
                    backgroundColor: '#ffcdd2',
                    borderColor: '#e57373',
                    textColor: '#b71c1c',
                  };
                }
                return {
                  id: appointment.id,
                  title: member ? member.name : 'Unknown Member',
                  start: appointment.start,
                  end: appointment.end,
                  memberId: appointment.memberId,
                  status: appointment.status,
                  ...eventStyle,
                };
              });
            setEvents(formattedEvents);
          }
          setSelectedEvent(null);
          setEventMember(null);
          setOpenEventDialog(false);
        })
        .catch(error => {
          console.error('예약 취소에 실패했습니다:', error);
          if (error.response && error.response.data && error.response.data.error) {
            alert(error.response.data.error);
          } else {
            alert('예약 취소에 실패했습니다. 다시 시도해주세요.');
          }
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
    setOpenEventDialog(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewMember({
      name: '',
      gender: '남',
      birthDate: '',
      purpose: '다이어트',
      phone: '',
      remainCount: 12,
      notes: '',
    });
  };
  const handleAddMember = () => {
    if (!newMember.name || !newMember.birthDate || !newMember.phone) {
      alert('이름, 생년월일, 전화번호는 필수입니다.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    axios
      .post('http://localhost:3001/api/members', {
        ...newMember,
        birth_date: newMember.birthDate,
        join_date: today,
        last_visit: '',
        notes: newMember.notes || '',
        remaining_sessions: newMember.remainCount,
        birthDate: undefined,
        remainCount: undefined,
      })
      .then(res => {
        setMembers([...members, res.data]);
        handleCloseAddDialog();
        // 회원 목록 갱신
        axios
          .get('http://localhost:3001/api/members')
          .then(response => {
            setMembers(response.data);
          })
          .catch(error => {
            console.error('회원 목록 갱신 실패:', error);
          });
      })
      .catch(() => {
        alert('회원 등록에 실패했습니다.');
      });
  };

  const handleViewDidMount = view => {
    setCurrentView(view.type);
    if (view.type === 'dayGridMonth') {
      setDayHeaderFormat({ month: 'long' });
    } else {
      setDayHeaderFormat({
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
        omitCommas: true,
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 3,
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        mt: 4,
      }}
    >
      {/* 좌측 통계 랭킹 (카드 바깥 별도 영역) */}
      <Box
        sx={{
          minWidth: 260,
          maxWidth: 300,
          flex: '0 0 260px',
          background: '#fffbe8',
          borderRadius: 2,
          p: 2,
          boxShadow: 1,
          height: 'fit-content',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LeaderboardIcon sx={{ color: BROWN_TEXT, mr: 1 }} />
          <Typography variant="h6" sx={{ color: BROWN_TEXT }}>
            방문 랭킹
          </Typography>
        </Box>
        <Tabs
          value={rankingTab}
          onChange={(_, v) => setRankingTab(v)}
          sx={{ mb: 1 }}
          textColor="secondary"
          indicatorColor="secondary"
        >
          <Tab label="최근 1주" />
          <Tab label="최근 1개월" />
        </Tabs>
        {rankingTab === 0 ? (
          <Box>
            {weeklyTop.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                데이터 없음
              </Typography>
            ) : (
              weeklyTop.map((item, idx) => (
                <Box key={item.member.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={`#${idx + 1}`}
                    size="small"
                    sx={{ mr: 1, background: '#ffe082', color: BROWN_TEXT, fontWeight: 700 }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.member.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {item.count}회
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        ) : (
          <Box>
            {monthlyTop.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                데이터 없음
              </Typography>
            ) : (
              monthlyTop.map((item, idx) => (
                <Box key={item.member.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={`#${idx + 1}`}
                    size="small"
                    sx={{ mr: 1, background: '#aed581', color: BROWN_TEXT, fontWeight: 700 }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.member.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {item.count}회
                  </Typography>
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
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
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
            list: '목록',
          }}
          eventContent={arg => {
            const isCompleted = arg.event.extendedProps.status === 'completed';
            return (
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  gap: 1.75,
                }}
              >
                <Box sx={{ flex: 1, textAlign: 'left', pr: 0.75 }}>
                  <Typography
                    sx={{
                      color: isCompleted ? '#212121' : '#3C1E1E',
                      fontSize: '15px',
                      fontWeight: isCompleted ? 600 : 400,
                    }}
                  >
                    {arg.event.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: 'right',
                    minWidth: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    opacity: 0.8,
                    '&:hover': {
                      opacity: 1,
                    },
                  }}
                >
                  <CloseIcon
                    sx={{
                      fontSize: '17px',
                      cursor: 'pointer',
                      color: isCompleted ? '#757575' : '#a67c52',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('이 예약을 삭제하시겠습니까?')) {
                        axios
                          .delete(`http://localhost:3001/api/appointments/${arg.event.id}`)
                          .then(() => {
                            return axios.get('http://localhost:3001/api/appointments');
                          })
                          .then(response => {
                            setAppointments(response.data);
                            if (members.length > 0) {
                              const formattedEvents = response.data
                                .filter(appointment => appointment.start && appointment.end)
                                .map(appointment => {
                                  const member = members.find(
                                    m => String(m.id) === String(appointment.memberId)
                                  );
                                  let eventStyle = {
                                    classNames: ['midas-event'],
                                    backgroundColor: '#f6e7d7',
                                    borderColor: '#a67c52',
                                    textColor: '#3C1E1E',
                                  };
                                  if (appointment.status === 'completed') {
                                    eventStyle = {
                                      classNames: ['midas-event', 'midas-event-completed'],
                                      backgroundColor: '#bdbdbd',
                                      borderColor: '#757575',
                                      textColor: '#212121',
                                    };
                                  } else if (appointment.status === 'cancelled') {
                                    eventStyle = {
                                      classNames: ['midas-event', 'midas-event-cancelled'],
                                      backgroundColor: '#ffcdd2',
                                      borderColor: '#e57373',
                                      textColor: '#b71c1c',
                                    };
                                  }
                                  return {
                                    id: appointment.id,
                                    title: member ? member.name : 'Unknown Member',
                                    start: appointment.start,
                                    end: appointment.end,
                                    memberId: appointment.memberId,
                                    status: appointment.status,
                                    ...eventStyle,
                                  };
                                });
                              setEvents(formattedEvents);
                            }
                          })
                          .catch(error => {
                            console.error('예약 삭제에 실패했습니다:', error);
                            if (
                              error.response &&
                              error.response.data &&
                              error.response.data.error
                            ) {
                              alert(error.response.data.error);
                            } else {
                              alert('예약 삭제에 실패했습니다. 다시 시도해주세요.');
                            }
                          });
                      }
                    }}
                  />
                </Box>
              </Box>
            );
          }}
          eventClassNames={arg => {
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
                getOptionLabel={option => `${option.name} (${option.phone})`}
                value={selectedMember}
                onChange={(event, newValue) => {
                  setSelectedMember(newValue);
                }}
                renderInput={params => (
                  <TextField {...params} label="회원 선택" fullWidth required autoFocus />
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

        <Dialog open={openEventDialog} onClose={handleCloseEventDialog} maxWidth="md" fullWidth>
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
                  color: theme => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {eventMember && (
              <Box sx={{ mt: 2, borderRadius: 6, background: '#fff', p: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  sx={{ mb: 2, background: BROWN_BG, borderRadius: 2 }}
                  textColor="secondary"
                  indicatorColor="secondary"
                >
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
                          <Typography variant="body2" color="text.secondary">
                            성별
                          </Typography>
                          <Typography variant="body1">{eventMember.gender}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            생년월일
                          </Typography>
                          <Typography variant="body1">
                            {eventMember.birth_date} (만 {getKoreanAge(eventMember.birth_date)}세)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            목적
                          </Typography>
                          <Typography variant="body1">{eventMember.purpose}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            전화번호
                          </Typography>
                          <Typography variant="body1">{eventMember.phone}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            회원가입일
                          </Typography>
                          <Typography variant="body1">{eventMember.join_date}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            최종방문일
                          </Typography>
                          <Typography variant="body1">{eventMember.last_visit}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            특이사항
                          </Typography>
                          <Typography variant="body1">
                            {eventMember.notes || eventMember.relationship}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            남은 관리횟수
                          </Typography>
                          <Typography variant="body1">
                            {eventMember.depends_on
                              ? (() => {
                                  const dependsOnMember = members.find(
                                    m => m.id === eventMember.depends_on
                                  );
                                  return dependsOnMember
                                    ? `${dependsOnMember.remaining_sessions}회`
                                    : '알 수 없음';
                                })()
                              : `${eventMember.remaining_sessions}회`}
                          </Typography>
                        </Grid>
                        {(() => {
                          let sharedWithArray = [];
                          if (eventMember && eventMember.shared_with) {
                            if (Array.isArray(eventMember.shared_with)) {
                              sharedWithArray = eventMember.shared_with;
                            } else {
                              try {
                                sharedWithArray = JSON.parse(eventMember.shared_with);
                              } catch {
                                sharedWithArray = [];
                              }
                            }
                          }
                          return (
                            <>
                              {sharedWithArray.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    공유 중인 회원
                                  </Typography>
                                  {sharedWithArray.map(id => {
                                    const sharedMember = members.find(m => m.id === id);
                                    return (
                                      sharedMember && (
                                        <Typography key={id} variant="body1">
                                          {sharedMember.name}
                                          <Chip
                                            label="공유 중"
                                            size="small"
                                            sx={{
                                              ml: 1,
                                              background: '#e8f5e9',
                                              color: '#2e7d32',
                                            }}
                                          />
                                        </Typography>
                                      )
                                    );
                                  })}
                                </Grid>
                              )}
                              {/* 의존 중인 회원 */}
                              {eventMember.depends_on && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    관리횟수 의존 대상
                                  </Typography>
                                  {(() => {
                                    const dependsOnMember = members.find(
                                      m => m.id === eventMember.depends_on
                                    );
                                    return dependsOnMember ? (
                                      <Typography variant="body1">
                                        {dependsOnMember.name}
                                        <Chip
                                          label="의존 중"
                                          size="small"
                                          sx={{
                                            ml: 1,
                                            background: '#e3f2fd',
                                            color: '#1565c0',
                                          }}
                                        />
                                      </Typography>
                                    ) : (
                                      <Typography variant="body1" color="text.secondary">
                                        알 수 없음
                                      </Typography>
                                    );
                                  })()}
                                </Grid>
                              )}
                            </>
                          );
                        })()}
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
                          <Paper
                            key={history.id}
                            elevation={0}
                            sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}
                          >
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

                    {selectedEvent && selectedEvent.status !== 'completed' && (
                      <Box mt={3}>
                        <Typography variant="h6" gutterBottom>
                          새로운 세션 내역
                        </Typography>
                        <TextareaAutosize
                          minRows={4}
                          placeholder="세션 내용을 입력하세요..."
                          value={treatmentNote}
                          onChange={e => setTreatmentNote(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '16px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
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
                            '&:hover': { background: '#e0cfc0' },
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
          <DialogActions
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 1,
              background: BROWN_BG,
            }}
          >
            {selectedEvent && selectedEvent.status !== 'completed' && (
              <Button
                onClick={handleCancelReservation}
                color="error"
                sx={{
                  background: BROWN_BG,
                  color: BROWN_TEXT,
                  '&:hover': { background: '#e0cfc0' },
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
                '&:hover': { background: '#e0cfc0' },
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
              <TextField
                label="이름"
                value={newMember.name}
                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                fullWidth
                required
              />
              <ToggleButtonGroup
                value={newMember.gender}
                exclusive
                onChange={(_, v) => v && setNewMember({ ...newMember, gender: v })}
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
                onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="남은 관리횟수"
                type="number"
                value={newMember.remainCount}
                onChange={e => setNewMember({ ...newMember, remainCount: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="특이사항"
                value={newMember.notes}
                onChange={e => setNewMember({ ...newMember, notes: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>취소</Button>
            <Button onClick={handleAddMember} variant="contained" color="primary">
              등록
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Box>
  );
};

export default CalendarTest;
