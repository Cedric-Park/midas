export const members = [
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
];

export const reservations = [
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
  },
  {
    id: 3,
    memberId: 1,
    startTime: "2025-05-03T14:00:00",
    endTime: "2025-05-03T14:30:00",
    title: "John Doe - Pain Management"
  },
  {
    id: 4,
    memberId: 3,
    startTime: "2025-05-04T15:00:00",
    endTime: "2025-05-04T15:30:00",
    title: "Mike Johnson - Pain Management"
  }
];
