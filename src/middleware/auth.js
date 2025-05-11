const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('유효하지 않은 토큰입니다.', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('만료된 토큰입니다.', 401));
    } else {
      next(error);
    }
  }
}; 