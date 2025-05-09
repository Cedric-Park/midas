const sqlite3 = require('better-sqlite3');
const db = new sqlite3('midas.db');

// 외래 키 제약 조건 활성화
db.pragma('foreign_keys = ON');

// 기존 테이블 삭제
db.exec(`
  DROP TABLE IF EXISTS treatmentHistory;
  DROP TABLE IF EXISTS appointments;
  DROP TABLE IF EXISTS patients;
`);

// 테이블 생성
db.exec(`
  CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT,
    birthDate TEXT,
    purpose TEXT,
    phone TEXT,
    remainCount INTEGER DEFAULT 0,
    relationship TEXT,
    joinDate TEXT,
    lastVisit TEXT
  );

  CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    FOREIGN KEY (patientId) REFERENCES patients(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  );

  CREATE TABLE treatmentHistory (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (patientId) REFERENCES patients(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  );
`);

// 기존 데이터 마이그레이션
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// patients 데이터 마이그레이션
const insertPatient = db.prepare(`
  INSERT INTO patients (id, name, gender, birthDate, purpose, phone, remainCount, relationship, joinDate, lastVisit)
  VALUES (@id, @name, @gender, @birthDate, @purpose, @phone, @remainCount, @relationship, @joinDate, @lastVisit)
`);

data.patients.forEach(patient => {
  try {
    insertPatient.run({
      id: patient.id || '',
      name: patient.name || '',
      gender: patient.gender || '',
      birthDate: patient.birthDate || '',
      purpose: patient.purpose || '',
      phone: patient.phone || '',
      remainCount: patient.remainCount || 0,
      relationship: patient.relationship || '',
      joinDate: patient.joinDate || '',
      lastVisit: patient.lastVisit || ''
    });
  } catch (error) {
    console.error('환자 데이터 마이그레이션 실패:', patient.id, error);
  }
});

// appointments 데이터 마이그레이션
const insertAppointment = db.prepare(`
  INSERT INTO appointments (id, patientId, start, end, status)
  VALUES (@id, @patientId, @start, @end, @status)
`);

data.appointments.forEach(appointment => {
  try {
    insertAppointment.run({
      id: appointment.id || '',
      patientId: appointment.patientId || '',
      start: appointment.start || '',
      end: appointment.end || '',
      status: appointment.status || 'scheduled'
    });
  } catch (error) {
    console.error('예약 데이터 마이그레이션 실패:', appointment.id, error);
  }
});

// treatmentHistory 데이터 마이그레이션
const insertTreatmentHistory = db.prepare(`
  INSERT INTO treatmentHistory (id, patientId, date, note)
  VALUES (@id, @patientId, @date, @note)
`);

data.treatmentHistory.forEach(history => {
  try {
    insertTreatmentHistory.run({
      id: history.id || '',
      patientId: history.patientId || '',
      date: history.date || '',
      note: history.note || ''
    });
  } catch (error) {
    console.error('진찰 내역 데이터 마이그레이션 실패:', history.id, error);
  }
});

console.log('데이터베이스 초기화 완료');
db.close(); 