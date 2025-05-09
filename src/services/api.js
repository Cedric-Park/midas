import { members, reservations } from './mockData';

// Initialize mock data if not already initialized
if (!members.length) {
  members.push(...[
    {
      id: 1,
      name: "John Doe",
      gender: "male",
      dateOfBirth: "1985-06-15",
      purpose: "pain_management",
      phoneNumber: "010-1234-5678",
      notes: "Has chronic back pain",
      points: 5,
      joinDate: "2025-01-15",
      lastVisitDate: "2025-04-25"
    },
    {
      id: 2,
      name: "Jane Smith",
      gender: "female",
      dateOfBirth: "1990-03-22",
      purpose: "diet",
      phoneNumber: "010-9876-5432",
      notes: "Following ketogenic diet",
      points: 3,
      joinDate: "2025-02-20",
      lastVisitDate: "2025-04-30"
    },
    {
      id: 3,
      name: "Mike Johnson",
      gender: "male",
      dateOfBirth: "1978-11-30",
      purpose: "pain_management",
      phoneNumber: "010-5678-1234",
      notes: "Knee pain issues",
      points: 4,
      joinDate: "2025-03-10",
      lastVisitDate: "2025-04-28"
    }
  ]);
}

if (!reservations.length) {
  reservations.push(...[
    {
      id: 1,
      memberId: 1,
      startTime: "2025-05-02T09:00:00",
      endTime: "2025-05-02T09:30:00",
      title: "John Doe - Pain Management"
    },
    {
      id: 2,
      memberId: 2,
      startTime: "2025-05-02T10:00:00",
      endTime: "2025-05-02T10:30:00",
      title: "Jane Smith - Diet"
    }
  ]);
}

export const getMembers = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...members]), 1000);
  });
};

export const getMember = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const member = members.find(m => m.id === id);
      if (member) {
        resolve(member);
      } else {
        reject(new Error(`Member with id ${id} not found`));
      }
    }, 1000);
  });
};

export const createMember = (memberData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const newMember = {
        ...memberData,
        id: members.length + 1,
        joinDate: new Date().toISOString().split('T')[0]
      };
      members.push(newMember);
      resolve(newMember);
    }, 1000);
  });
};

export const updateMember = (id, memberData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = members.findIndex(m => m.id === id);
      if (index !== -1) {
        members[index] = { ...members[index], ...memberData };
        resolve(members[index]);
      } else {
        reject(new Error(`Member with id ${id} not found`));
      }
    }, 1000);
  });
};

export const getReservations = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...reservations]), 1000);
  });
};

export const createReservation = (reservationData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const newReservation = {
        ...reservationData,
        id: reservations.length + 1,
        title: `${members.find(m => m.id === reservationData.memberId)?.name} - ${reservationData.purpose}`
      };
      reservations.push(newReservation);
      resolve(newReservation);
    }, 1000);
  });
};

export const deleteReservation = (id) => {
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
