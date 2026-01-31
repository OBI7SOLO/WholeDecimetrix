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
      const assets = await Asset.find(query).populate('createdBy', 'email role').lean();
      res.json(assets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  const createAsset = async (req, res) => {
    try {
      const asset = new Asset({ ...req.body, createdBy: req.user.id });
      await asset.save();
      const populated = await asset.populate('createdBy', 'email role');
      io.emit('new-asset', populated);
      res.status(201).json(populated);
    } catch (err) {
      res.status(400).json({ error: err.message });
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
      io.emit('asset-updated', populated);
      res.json(populated);
    } catch (err) {
      res.status(400).send(err.message);
    }
  };

  const deleteAsset = async (req, res) => {
    try {
      const asset = await Asset.findById(req.params.id);
      const error = ensureAccess(asset, req.user);
      if (error) return res.sendStatus(error);

      await asset.deleteOne();
      io.emit('asset-deleted', { id: req.params.id });
      res.sendStatus(204);
    } catch (err) {
      res.status(500).send(err.message);
    }
  };

  return { getAssets, createAsset, updateAsset, deleteAsset };
};
