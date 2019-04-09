import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import cors from 'cors';
import debug from 'debug';
import expressValidator from 'express-validator';
import mongoose from 'mongoose';
import config from './config';
import routes from './routes';
import traceLogger from './logger/traceLogger';
import UsersController from './controllers/UsersController';

// setup console logger
const consoleLogger = debug('log');

const app = express();
app.use(cors());

// Log requests to the console.
app.use(logger('dev'));

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Validator to check requests
app.use(expressValidator());

let mongoURL;
if (process.env.NODE_ENV === 'test') {
  mongoURL = config.DB_URL_TEST;
} else if (process.env.NODE_ENV === 'production') {
  mongoURL = config.DB_URL_PROD;
} else {
  mongoURL = config.MONGODB_DATABASE;
}
// connect to mongodb
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}, () => {
  consoleLogger('connected to mongodb');
  process.stdout.write('connected to mongodb');
});

app.get('/api', (req, res) => {
  res.json('Welcome to Hala Api');
});

(async () => await UsersController.createSupport())();

// Routes
app.use('/api', routes);

// Setup a default catch-all route
app.use('*', (req, res, next) => {
  res.status(404).json({
    message: 'Page not found',
  });
  next();
});

const {
  PORT
} = config;
const appServer = app.listen(PORT, () => {
  consoleLogger(`App now listening for requests on ${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  traceLogger(reason);
});

process.on('uncaughtException', (reason) => {
  traceLogger(reason);
});

export default app;
