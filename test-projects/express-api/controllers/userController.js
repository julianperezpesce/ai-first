const userService = require('../services/userService');

async function getAll(req, res) {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function update(req, res) {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  try {
    await userService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAll, getById, create, update, delete: remove };
