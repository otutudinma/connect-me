import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';

const { createLogger, transports, format } = winston;

const logPath = 'ErrorLogs';

const {
  combine, timestamp, label, printf
} = format;

const myFormat = printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`); /* eslint-disable-line */

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath);
}

const { NODE_ENV } = process.env;

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${logPath}/%DATE%-results.log`,
  datePattern: 'YYYY-MM-DD',
});

const logger = createLogger({
  level: NODE_ENV === 'development' ? 'verbose' : 'info',
  format: combine(
    label({ label: 'Logs!' }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    myFormat,
  ),
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        myFormat
      )
    }),
    dailyRotateFileTransport
  ]
});

export default logger;
