import elasticsearch from 'elasticsearch';
import config from '../config';
import traceLogger from '../logger/traceLogger';

const port = config.ELASTIC_SEARCH.PORT;
const host = config.ELASTIC_SEARCH.HOST;

// Create an Instance of connection to elasticSearch server
const connect = () => {
  let client = null;
  if (client == null) {
    client = new elasticsearch.Client({
      host: `${host}:${port}`,
      log: 'info'
    });
  }
  return client;
};

const isESUp = (call) => {
  const client = connect();
  client.ping({
    requestTimeout: 30000
  }, (error) => {
    if (error) {
      console.error('elasticsearch cluster is down!');
      call(0);
    } else {
      console.log('elasticsearch is well');
      call(1);
    }
  });
};

// Creates an Index (DB) on Elasticsearch
const createIndex = (indexName, call) => {
  const client = connect();
  client.indices.create({
    index: indexName
  },
  (err, resp, status) => {
    if (err) {
      console.log('elastic error');
      call(0);
    } else {
      console.log('elastic success');
      call(status);
    }
  });
};

// Deletes an Index(DB) from Elasticsearch
const deleteIndex = (indexName, call) => {
  const client = connect();
  client.indices.delete({
    index: indexName
  },
  (err, resp) => {
    call(resp);
  });
};
   // deleteIndex('halaapp-users', es=> es)
// Creates a mapped Type
const mapType = (indexName, typeName, body, call) => {
  const client = connect();
  client.indices.putMapping({
    index: indexName,
    type: typeName,
    body
  },
  (err, resp) => {
    if (err) {
      call(err);
    } else {
      call(resp);
    }
  });
};

// Adds data to a Type
const addData = (indexName, typeName, id, data, call) => {
  const client = connect();
  client.index({
    index: indexName,
    id,
    type: typeName,
    body: data
  },
  (err, resp, status) => {
    console.log(resp);
    if (err) {
      call(0);
    } else {
      call(1);
    }
  });
};

// Updates data in Type
const updateData = (indexName, typeName, id, data, call) => {
  const client = connect();
  client.update({
    index: indexName,
    type: typeName,
    id,
    body: {
      doc: data
    }
  },
  (error, response) => {
    console.log(response);
    if (error) call(0);
    else call(1);
  });
};

// Deletes data from a Type
const deleteData = (indexName, typeName, id, call) => {
  const client = connect();
  client.delete({
    index: indexName,
    id,
    type: typeName,
    ignore: [404]
  },
  (err, resp, status) => {
    if (err) {
      call(0);
    } else {
      call(1);
    }
  });
};

const countAllData = (indexName, typeName, call) => {
  const client = connect();
  client.count({
    index: indexName,
    type: typeName
  },
  (err, resp, status) => {
    if (err) {
      call(0);
    } else {
      call(resp.count);
    }
  });
};

const getMapping = (indexName, typeName, call) => {
  const client = connect();
  client.indices.getMapping({
    index: indexName,
    type: typeName
  },
  (error, response) => {
    if (error) {
      call(error.message);
    } else {
      call(response);
    }
  });
};

const matchSearch = (indexName, typeName, query) => {
  const client = connect();
  const searchResult = client.search({
    index: indexName,
    body: query,
    type: typeName,
  })
    .then((result) => {
      const {
        hits: {
          hits
        }
      } = result;
      return hits.map(hit => hit._source);
    }) // eslint-disable-line
    .catch((error) => {
      traceLogger(error);
    });

  return searchResult;
};

const retrieveOne = (indexName, typeName, id) => {
  const client = connect();
  const data = client.get({
    index: indexName,
    type: typeName,
    id
  })
    .then(result => result._source) // eslint-disable-line
    .catch((error) => {
      traceLogger(error);
    });

  return data;
};

const aSearch = (indexName, typeName, query) => {
  const client = connect();
  const searchResult = client.search({
    index: indexName,
    type: typeName,
    body: query
  }).then((result) => {
    const {
      hits: {
        hits
      }
    } = result;
    return hits.map(hit => hit._source);
    }) // eslint-disable-line
    .catch((error) => {
      traceLogger(error);
    });

  return searchResult;
};

const countAllDBData = (call) => {
  const client = connect();
  client.count((error, response, status) => {
    // check for and handle error
    if (error) call(0);
    call(response.count);
  });
};

const countByQuery = (indexName, query, call) => {
  const client = connect();
  client.count({
    index: indexName,
    body: query
  },
  (err, response) => {
    call(response);
  });
  call(0);
};

const isDataExist = (indexName, typeName, _id, data, call) => {
  const client = connect();
  client.exists({
    index: indexName,
    type: typeName,
    id: _id
  }, (
    error,
    exists
  ) => {
    if (exists) {
      call(1);
    } else {
      call(0);
    }
  });
};

export default {
  isESUp,
  createIndex,
  deleteIndex,
  mapType,
  addData,
  deleteData,
  countAllData,
  countAllDBData,
  getMapping,
  matchSearch,
  aSearch,
  countByQuery,
  updateData,
  isDataExist,
  retrieveOne
};
