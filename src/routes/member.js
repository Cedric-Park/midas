const express = require('express');
const router = express.Router();
const {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember
} = require('../controllers/memberController');

router.post('/', createMember);
router.get('/', getMembers);
router.get('/:id', getMemberById);
router.put('/:id', updateMember);
router.patch('/:id', updateMember);
router.delete('/:id', deleteMember);

module.exports = router; 