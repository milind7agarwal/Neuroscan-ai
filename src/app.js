const express = require('express');
const morgan = require('morgan');
const authRouter = require('./routes/auth.routes.js');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRouter);

module.exports = app;