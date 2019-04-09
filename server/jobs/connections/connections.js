import rabbit from '../../helpers/rabbitmq';
import redis from '../../helpers/redis';
import elastic from '../../helpers/elasticsearch';

const Redis = new redis();

const QUEUE_NAME = 'connections';
const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';
rabbit.rabbitReceive(QUEUE_NAME, async (rabbitResponse) => {
  const queueData = JSON.parse(rabbitResponse);

  const userId = queueData.phoneNumber;
  delete (queueData._id);

  elastic.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, userId, queueData, (esResponse) => {
    if (esResponse) {
      // Successfully saved to Elasticsearch
      Redis.setObject(userId, queueData).then((redisStatus) => {
        console.log(`Successfully save to REDIS ${redisStatus}`);
      });
    }
  });
});
