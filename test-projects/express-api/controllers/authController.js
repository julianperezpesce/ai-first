const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

const SECRET = process.env.JWT_SECRET || 'secret';

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyCredentials(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function register(req, res) {
  try {
    const { email, password } = req.body;
    const user = await authService.createUser(email, password);
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { login, register };
