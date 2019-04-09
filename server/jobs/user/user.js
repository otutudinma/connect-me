import rabbit from '../../helpers/rabbitmq';
import redis from '../../helpers/redis';
import elastic from '../../helpers/elasticsearch';

const Redis = new redis();

const QUEUE_NAME = 'users';
const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';
rabbit.rabbitReceive(QUEUE_NAME, (rabbitResponse) => {
  const queueData = JSON.parse(rabbitResponse);
  const userId = queueData.phoneNumber;
  delete (queueData._id);
  if (queueData.verified === 'pending') {
    elastic.addData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, userId, queueData, (esResponse) => {
      if (esResponse) {
        // Successfully saved to Elasticsearch
        Redis.setObject(userId, queueData).then((redisStatus) => {
          process.stdout.write(`Successfully save to REDIS ${redisStatus}`);
        });
      }
    });
  }
  elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, userId, queueData, (esResponse) => {
    if (esResponse) {
      // Successfully saved to Elasticsearch
      Redis.setObject(userId, queueData).then((redisStatus) => {
        process.stdout.write(`Successfully save to REDIS ${redisStatus}`);
      });
    }
  });
});
