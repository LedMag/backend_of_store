'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const routing = require('./components/routing');

const HOST = '127.0.0.1';
const PORT = 8080;
const fullUrl = `http://${HOST}:${PORT}`


const table = {
  '/market/products': 'products',
  '/market/brands': 'brands',
  '/market/markets': 'markets',
  '/market/types': 'productstypes',
  '/admin/products': 'products',
  '/admin/brands': 'brands',
  '/admin/markets': 'markets',
  '/admin/types': 'productstypes'
}
//   const tableName = table[url.pathname];
//   params.push(tableName);

const matching = [];
for (const key in routing) {
  if (key.includes('*')) {
    const rx = new RegExp(key.replace('*', '([a-z]+(?=\\?)?)'), 'i');
    const route = routing[key];
    matching.push([rx, route]);
    delete routing[key];
  }
}

const types = {
  object: JSON.stringify,
  string: s => s,
  number: n => n + '',
  undefined: () => {
    console.log('not found');
  },
  function: (fn, client, par) => fn(client, par),
};

const getParams = client => {
  const params = [];
  const url = new URL(client.req.url, fullUrl);
  let route = routing[client.req.url];
  if (!route) {
    for (let i = 0; i < matching.length; i++) {
      const rx = matching[i];
      const method = url.pathname.match(rx[0]);
      if (method) {
        params.push(table[method[0]]);
        route = rx[1];
        break;
      }
    }
  }
  url.searchParams.forEach((value, name) => {
    params.push({ [name]: value });
  });

  const type = typeof route;
  const renderer = types[type];
  return renderer(route, client, params);
}


const router = (client) => {
  let filePath = path.join(__dirname, client.req.url === '/' ? 'index.html' : client.req.url);
  let ext = path.extname(filePath);
  let contentType = 'text/html'

  if(ext === '.html') {
    contentType = 'text/html';
  }else if (ext === '.css') {
    contentType = 'text/css';
  }else if (ext === '.js') {
    contentType = 'text/javascript';
  }else if (ext === '.jpg') {
    contentType = 'image/jpeg';
  }else if (ext === '.ico') {
    contentType = 'image/x-icon';
  }else {
    getParams(client)
    return
  }

  if(!ext) {
    getParams(client)
  }else {
    fs.readFile(path.join(filePath), (err, data) => {
      if(err){
        throw err
      }
      client.res.setHeader('Access-Control-Allow-Origin', '*');
      client.res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
      client.res.writeHead(200, {
        'Content-Type': contentType
      })
      client.res.end(data)
    })
  }
}


http.createServer({}, (req, res) => {
  router({ req, res });
}).listen(PORT, HOST, () => {
  console.log(`Server listens http://${HOST}:${PORT}`)
})
