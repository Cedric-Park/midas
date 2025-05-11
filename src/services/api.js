import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const getMembers = async () => {
  const response = await axios.get(`${API_BASE_URL}/members`);
  return response.data;
};

export const getMember = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/members/${id}`);
  return response.data;
};

export const createMember = async (memberData) => {
  const response = await axios.post(`${API_BASE_URL}/members`, memberData);
  return response.data;
};

export const updateMember = async (id, memberData) => {
  const response = await axios.patch(`${API_BASE_URL}/members/${id}`, memberData);
  return response.data;
};

export const deleteMember = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/members/${id}`);
  return response.data;
};

export const getReservations = () => {
  return new Promise(resolve => {
    setTimeout(() => resolve([...reservations]), 1000);
  });
};

export const createReservation = reservationData => {
  return new Promise((resolve, reject) => {
    try {
      const newReservation = {
        ...reservationData,
        id: reservations.length + 1,
        title: `${members.find(m => m.id === reservationData.memberId)?.name} - ${reservationData.purpose}`,
      };
      reservations.push(newReservation);
      resolve(newReservation);
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteReservation = id => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        reservations.splice(index, 1);
        resolve(true);
      } else {
        reject(new Error(`Reservation with id ${id} not found`));
      }
    }, 1000);
  });
};
