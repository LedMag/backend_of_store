'use strict';

const builder = require('./builder.js');
const config = require('./dbConfig.js')

const db = builder.open(config);


const routing = {
  '/market/*': (client, [table, ...params]) => {
    db.select(table)
      .where(params)
      .then((res) => {
        client.res.setHeader('Access-Control-Allow-Origin', '*');
        client.res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
        client.res.writeHead(200, {
          'Content-Type': 'application/json'
        });
        client.res.end(JSON.stringify(res));
      });
  },
  '/admin/*': (client, [table, ...params]) => {
    db.insert(table)
      .values(params)
      .then((res) => {
        client.res.end(true)
      });
  },
  'admin/delete/*': (client, [table, ...params]) => {
    db.delete(table)
      .where(params)
      .then((res) => {
        client.res.end(true)
      });
  }
}

module.exports = routing;
