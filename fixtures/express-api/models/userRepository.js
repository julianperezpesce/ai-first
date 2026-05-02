const users = [];

const db = {
  findAll: () => Promise.resolve(users),
  findById: (id) => Promise.resolve(users.find(u => u.id === id)),
  findByEmail: (email) => Promise.resolve(users.find(u => u.email === email)),
  create: (data) => {
    const user = { id: String(users.length + 1), ...data };
    users.push(user);
    return Promise.resolve(user);
  },
  update: (id, data) => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return Promise.resolve(null);
    users[index] = { ...users[index], ...data };
    return Promise.resolve(users[index]);
  },
  delete: (id) => {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) users.splice(index, 1);
    return Promise.resolve();
  }
};

module.exports = db;
