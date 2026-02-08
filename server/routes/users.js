// User routes restricted to admin role.
const express = require('express');
const { authenticateJWT, authorize } = require('../middlewares/auth');
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
    authorize('admin'),
    validateBody(userCreateSchema),
    controllers.createUser,
  );
  router.get('/', authenticateJWT, authorize('admin'), controllers.getUsers);
  router.put(
    '/:id',
    authenticateJWT,
    authorize('admin'),
    validateBody(userUpdateSchema),
    controllers.updateUser,
  );
  router.delete(
    '/:id',
    authenticateJWT,
    authorize('admin'),
    controllers.deleteUser,
  );

  return router;
};
