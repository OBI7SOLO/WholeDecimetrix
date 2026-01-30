const express = require('express');
const { authenticateJWT } = require('../middlewares/auth');
const {
  validateBody,
  assetCreateSchema,
  assetUpdateSchema,
} = require('../middlewares/validation');

module.exports = (controllers) => {
  const router = express.Router();

  router.get('/', authenticateJWT, controllers.getAssets);
  router.post('/', authenticateJWT, validateBody(assetCreateSchema), controllers.createAsset);
  router.put(
    '/:id',
    authenticateJWT,
    validateBody(assetUpdateSchema),
    controllers.updateAsset,
  );
  router.delete('/:id', authenticateJWT, controllers.deleteAsset);

  return router;
};
