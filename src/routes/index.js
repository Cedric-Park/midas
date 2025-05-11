const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const memberRouter = require('./member');
const sessionRouter = require('./session');
const appointmentRouter = require('./appointment');
const statisticsRouter = require('./statistics');
const sessionHistoryRouter = require('./sessionHistory');

router.use('/auth', authRouter);
router.use('/members', memberRouter);
router.use('/sessions', sessionRouter);
router.use('/appointments', appointmentRouter);
router.use('/statistics', statisticsRouter);
router.use('/sessionHistory', sessionHistoryRouter);

module.exports = router; 