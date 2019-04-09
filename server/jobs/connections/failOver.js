import glob from 'glob';
import fs from 'fs-extra';
import rabbitMq from '../../helpers/rabbitmq';
import redis from '../../helpers/redis';
import elasticSearch from '../../helpers/elasticsearch';

const QUEUE_NAME = 'connections';
const INDEX_NAME = 'halaapp';
const TYPE_NAME = 'users';

glob('jobs/user/*-connection.json', (err, files) => {
  if (err) {
    return err;
  }
  if (files.length !== 0) {
    // return files;
    files.forEach((element) => {
      fs.readFile(element, 'utf8', (err, value) => {
        if (err) {
          return err;
        }
        const data = value;
        rabbitMq.rabbitSend(QUEUE_NAME, data, true, resp => resp);
        rabbitMq.rabbitReceive(QUEUE_NAME, (res) => {
          const queueData = JSON.parse(res);
          const userId = queueData.phoneNumber;

          const Redis = new redis();
          Redis.setObject(userId, queueData).then(i => i);
          elasticSearch.updateData(`${INDEX_NAME}-${TYPE_NAME}`, TYPE_NAME, userId, queueData,
            resp => resp);
        });
        const id = JSON.parse(data);
        fs.remove(`jobs/user/${id._id}-connection.json`, (err) => {
          if (err) return console.error(err);
          console.log('success!');
        });
        return rabbitMq;
      });
    });
  }
});
