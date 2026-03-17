class UserService {
  constructor(repository) {
    this.repository = repository;
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id) {
    return this.repository.findById(id);
  }

  async create(data) {
    return this.repository.create(data);
  }

  async update(id, data) {
    return this.repository.update(id, data);
  }

  async remove(id) {
    return this.repository.delete(id);
  }
}

const repository = require('../models/userRepository');
module.exports = new UserService(repository);
