import logger from './logger';

/* istanbul ignore next */
const traceLogger = (reason) => {
  logger.error(`${reason.stack}\n`);
};

export default traceLogger;
