// Asset controller: CRUD and role-based access.
const Asset = require('../models/Asset');

module.exports = (io) => {
  const ensureAccess = (asset, user) => {
    if (!asset) return 404;
    const isOwner = String(asset.createdBy) === String(user.id);
    if (!isOwner && user.role !== 'admin') return 403;
    return null;
  };

  const getAssets = async (req, res) => {
    try {
      const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
      const assets = await Asset.find(query)
        .populate('createdBy', 'email role')
        .lean();
      res.json(assets);
    } catch {
      res.status(500).json({ message: 'Error obteniendo activos' });
    }
  };

  const createAsset = async (req, res) => {
    try {
      const asset = new Asset({ ...req.body, createdBy: req.user.id });
      await asset.save();
      const populated = await asset.populate('createdBy', 'email role');
      // Notify admins and the creator
      io.to('admins').emit('new-asset', populated);
      io.to(`user:${req.user.id}`).emit('new-asset', populated);
      res.status(201).json(populated);
    } catch {
      res.status(400).json({ message: 'Error al crear activo' });
    }
  };

  const updateAsset = async (req, res) => {
    try {
      const asset = await Asset.findById(req.params.id);
      const error = ensureAccess(asset, req.user);
      if (error) return res.sendStatus(error);

      Object.assign(asset, req.body);
      await asset.save();

      const populated = await asset.populate('createdBy', 'email role');
      io.to('admins').emit('asset-updated', populated);
      io.to(`user:${String(asset.createdBy._id || asset.createdBy)}`).emit(
        'asset-updated',
        populated,
      );
      res.json(populated);
    } catch {
      res.status(400).json({ message: 'Error al actualizar activo' });
    }
  };

  const deleteAsset = async (req, res) => {
    try {
      const asset = await Asset.findById(req.params.id);
      const error = ensureAccess(asset, req.user);
      if (error) return res.sendStatus(error);

      const creatorId = String(asset.createdBy);
      await asset.deleteOne();
      io.to('admins').emit('asset-deleted', { id: req.params.id });
      io.to(`user:${creatorId}`).emit('asset-deleted', { id: req.params.id });
      res.sendStatus(204);
    } catch {
      res.status(500).json({ message: 'Error al eliminar activo' });
    }
  };

  return { getAssets, createAsset, updateAsset, deleteAsset };
};
