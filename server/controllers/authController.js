const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_SESSIONS = 5;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

const setRefreshCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Campos inválidos' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMin = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Cuenta bloqueada. Intenta de nuevo en ${remainingMin} minutos.`,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    if (user.refreshTokens.length >= MAX_SESSIONS) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push({ tokenHash: hashToken(refreshToken) });
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Token invalidado' });
    }

    const tokenHash = hashToken(token);
    const tokenIndex = user.refreshTokens.findIndex(
      (rt) => rt.tokenHash === tokenHash,
    );

    if (tokenIndex === -1) {
      // Reuse detected: invalidate ALL sessions
      user.refreshTokens = [];
      user.tokenVersion += 1;
      await user.save();
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        message:
          'Reuso de refresh token detectado. Todas las sesiones invalidadas.',
      });
    }

    // Rotate: remove old, create new
    user.refreshTokens.splice(tokenIndex, 1);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens.push({ tokenHash: hashToken(newRefreshToken) });
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch {
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const logoutHandler = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(payload.id);

      if (user) {
        const tokenHash = hashToken(token);
        user.refreshTokens = user.refreshTokens.filter(
          (rt) => rt.tokenHash !== tokenHash,
        );
        await user.save();
      }
    } catch {
      // Token invalid, just clear cookie
    }
  }

  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logout exitoso' });
};

module.exports = { login, refresh, logout: logoutHandler };
