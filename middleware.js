module.exports = (req, res, next) => {
  // appointments DELETE 요청 처리
  if (req.method === 'DELETE' && req.path.startsWith('/appointments/')) {
    const db = req.app.db; // lowdb instance
    const appointmentId = req.path.split('/').pop(); // URL에서 ID 추출

    // appointments에서만 해당 ID를 찾아서 삭제
    const appointments = db.get('appointments').value();
    const updatedAppointments = appointments.filter(
      app => String(app.id) !== String(appointmentId)
    );

    // appointments 배열만 업데이트
    db.set('appointments', updatedAppointments).write();

    return res.json({ success: true });
  }

  // 다른 요청은 기본 처리
  next();
};
