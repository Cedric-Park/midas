const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/knex');
const { AppError } = require('../middleware/errorHandler');

exports.login = async (req, res, next) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      throw new AppError('아이디와 비밀번호를 입력해주세요.', 400);
    }

    const user = await db('users').where({ id }).first();
    if (!user) {
      throw new AppError('아이디 또는 비밀번호가 일치하지 않습니다.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('아이디 또는 비밀번호가 일치하지 않습니다.', 401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      throw new AppError('현재 비밀번호와 새 비밀번호를 입력해주세요.', 400);
    }

    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('현재 비밀번호가 일치하지 않습니다.', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db('users')
      .where({ id: userId })
      .update({
        password: hashedPassword,
        updated_at: db.fn.now()
      });

    res.status(200).json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await db('users')
      .where({ id: userId })
      .select('id', 'role')
      .first();

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}; 