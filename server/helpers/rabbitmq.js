import amqp from 'amqplib/callback_api';
import config from '../config';

const HOST = config.RABBITMQ_HOST;
const USERNAME = config.RABBITMQ_USERNAME;
const PASSWORD = config.RABBITMQ_PASSWORD;

const checkConnection = async () => {
  const client = await amqp.connect(`amqp://${USERNAME}:${PASSWORD}@${HOST}`,
    (err, conn) => {
      if (err) {
        return err;
      }
      return conn;
    });
  return client;
};

const bail = (err) => {
  process.stdout.write(err)
};

const rabbitSend = (queueName, message, timeout, call) => {
  amqp.connect(`amqp://${USERNAME}:${PASSWORD}@${HOST}`,
    (err, conn) => {
      if (err) {
        call(false);
        return false;
      }
      conn.createChannel((err, channel) => {
        const queue = queueName;
        channel.assertQueue(queue, { durable: true });
        // Note: on Node 6 Buffer.from(msg) should be used
        const _response = channel.sendToQueue(queue, Buffer.from(message), {
          persistent: true
        });
        console.log('RabbitMq response get here', _response);
        console.log(' [x] Sent');
        if (_response) {
          call(true);
        } else {
          call(false);
        }
      });

      // If the Producer should timeout
      if (timeout) {
        setTimeout(() => {
          conn.close();
        }, 500);
      }
    });
};

/* istanbul ignore next */
const rabbitReceive = (queueName, call) => {
  amqp.connect(`amqp://${USERNAME}:${PASSWORD}@${HOST}`,
    (err, conn) => {
      if (err) {
        console.log('RabbitMq server is down', false);
        call(false);
        return false;
      }
      conn.createChannel((err, channel) => {
        if (err) {
          call(false);
        } else {
          const queue = queueName;

          channel.assertQueue(queue, { durable: true });
          channel.prefetch(1);

          // Note: on Node 6 Buffer.from(msg) should be used
          // channel.sendToQueue(queue, new Buffer(message));
          // console.log(" [x] Sent");

          console.log(
            ' [*] Waiting for messages in %s. To exit press CTRL+C',
            queue
          );
          channel.consume(
            queue,
            (msg) => {
              let _isdone = false;
              console.log(' [x] Received %s', msg.content.toString());
              _isdone = true;

              if (_isdone) {
                console.log(' [x] Done');
                channel.ack(msg);
                call(msg.content.toString());
              }
            },
            { noAck: false }
          );
        }
      });
    });
};

export default {
  rabbitSend,
  rabbitReceive,
  checkConnection
};
