const rateLimit = require('express-rate-limit');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip.replace(/^::ffff:/, '');
    return `${ip}-${req.body?.email?.toLowerCase() || 'unknown'}`;
  },
  validate: { keyGeneratorIpFallback: false },
});

const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginRateLimiter, apiRateLimiter };
