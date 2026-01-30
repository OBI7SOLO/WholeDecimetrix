const express = require('express');
const { authenticateJWT, requireAdmin } = require('../middlewares/auth');
const {
  validateBody,
  userCreateSchema,
  userUpdateSchema,
} = require('../middlewares/validation');

module.exports = (controllers) => {
  const router = express.Router();

  router.post(
    '/',
    authenticateJWT,
    requireAdmin,
    validateBody(userCreateSchema),
    controllers.createUser,
  );
  router.get('/', authenticateJWT, requireAdmin, controllers.getUsers);
  router.put(
    '/:id',
    authenticateJWT,
    requireAdmin,
    validateBody(userUpdateSchema),
    controllers.updateUser,
  );
  router.delete('/:id', authenticateJWT, requireAdmin, controllers.deleteUser);

  return router;
};
