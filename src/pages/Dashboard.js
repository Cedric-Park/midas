import React, { useState, useEffect } from 'react';
import Calendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { getMembers, getReservations, createReservation, deleteReservation } from '../services/api';
import axios from 'axios';

const Dashboard = () => {
  const [view, setView] = useState('timeGridWeek');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [openMemberModal, setOpenMemberModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchReservations();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleDateSelect = (arg) => {
    setSelectedSlot({
      startStr: arg.startStr,
      endStr: arg.endStr,
      allDay: arg.allDay
    });
    setOpenMemberModal(true);
  };

  const handleEventClick = (arg) => {
    setSelectedSlot({
      event: arg.event,
      startStr: arg.event.startStr,
      endStr: arg.event.endStr,
      allDay: arg.event.allDay
    });
    setOpenCancelModal(true);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
  };

  const createReservation = async () => {
    try {
      const newAppointment = {
        patientId: selectedMember.id,
        start: selectedSlot.startStr,
        end: selectedSlot.endStr,
        status: 'scheduled'
      };
      
      const response = await axios.post('http://localhost:3001/appointments', newAppointment);
      setOpenMemberModal(false);
      setSelectedSlot(null);
      setSelectedMember(null);
      fetchReservations();
    } catch (error) {
      console.error('예약 생성에 실패했습니다:', error);
      alert('예약 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const cancelReservation = async () => {
    try {
      await axios.patch(`http://localhost:3001/appointments/${selectedSlot.event.id}`, {
        status: 'cancelled'
      });
      setOpenCancelModal(false);
      setSelectedSlot(null);
      fetchReservations();
    } catch (error) {
      console.error('예약 취소에 실패했습니다:', error);
      alert('예약 취소에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Button
          variant={view === 'timeGridDay' ? 'contained' : 'outlined'}
          onClick={() => setView('timeGridDay')}
        >
          Day
        </Button>
        <Button
          variant={view === 'timeGridWeek' ? 'contained' : 'outlined'}
          onClick={() => setView('timeGridWeek')}
          style={{ marginLeft: '8px' }}
        >
          Week
        </Button>
        <Button
          variant={view === 'timeGridMonth' ? 'contained' : 'outlined'}
          onClick={() => setView('timeGridMonth')}
          style={{ marginLeft: '8px' }}
        >
          Month
        </Button>
      </div>

      <Calendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView={view}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        events={reservations.map(r => ({
          id: r.id,
          title: r.title,
          start: r.startTime,
          end: r.endTime,
          memberId: r.memberId
        }))}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
      />

      <Dialog open={openMemberModal} onClose={() => setOpenMemberModal(false)}>
        <DialogTitle>Select Member</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Member</InputLabel>
            <Select
              value={selectedMember?.id || ''}
              onChange={(e) => {
                const member = members.find(m => m.id === e.target.value);
                handleMemberSelect(member);
              }}
            >
              {members.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberModal(false)}>Cancel</Button>
          <Button onClick={createReservation} variant="contained" color="primary">
            Reserve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCancelModal} onClose={() => setOpenCancelModal(false)}>
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to cancel this reservation?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelModal(false)}>Cancel</Button>
          <Button onClick={cancelReservation} variant="contained" color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: '20px' }}
        onClick={() => window.location.href = '/register'}
      >
        Register New Member
      </Button>
    </div>
  );
};

export default Dashboard;
