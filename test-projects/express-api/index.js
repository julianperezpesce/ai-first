const express = require('express');
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');

const app = express();
app.use(express.json());

app.post('/auth/login', authController.login);
app.post('/auth/register', authController.register);
app.get('/users', userController.getAll);
app.get('/users/:id', userController.getById);
app.post('/users', userController.create);
app.put('/users/:id', userController.update);
app.delete('/users/:id', userController.delete);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
