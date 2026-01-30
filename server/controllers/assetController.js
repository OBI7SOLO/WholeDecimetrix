const Asset = require('../models/Asset');

module.exports = (io) => {
  const getAssets = async (req, res) => {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    const assets = await Asset.find(query).populate('createdBy', 'email role').lean();
    res.json(assets);
  };

  const createAsset = async (req, res) => {
    const asset = new Asset({ ...req.body, createdBy: req.user.id });
    await asset.save();
    const populated = await asset.populate('createdBy', 'email role');
    io.emit('new-asset', populated);
    res.status(201).json(populated);
  };

  const updateAsset = async (req, res) => {
    try {
      const asset = await Asset.findById(req.params.id);
      if (!asset) return res.sendStatus(404);
      const isOwner = String(asset.createdBy) === String(req.user.id);
      if (!isOwner && req.user.role !== 'admin') return res.sendStatus(403);

      const updatableFields = ['name', 'type', 'lat', 'lng', 'comments'];
      updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) asset[field] = req.body[field];
      });

      await asset.save();
      const populated = await asset.populate('createdBy', 'email role');
      io.emit('asset-updated', populated);
      res.json(populated);
    } catch (err) {
      console.error('Error updating asset:', err);
      res.status(400).send(err.message);
    }
  };

  const deleteAsset = async (req, res) => {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.sendStatus(404);
    const isOwner = String(asset.createdBy) === String(req.user.id);
    if (!isOwner && req.user.role !== 'admin') return res.sendStatus(403);

    await asset.deleteOne();
    io.emit('asset-deleted', { id: req.params.id });
    res.sendStatus(204);
  };

  return { getAssets, createAsset, updateAsset, deleteAsset };
};
