const bcrypt = require('bcrypt');
const userRepository = require('../models/userRepository');

async function verifyCredentials(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
}

async function createUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return userRepository.create({ email, password: hashedPassword });
}

module.exports = { verifyCredentials, createUser };
