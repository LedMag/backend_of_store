'use strict';

const mysql = require("mysql");


const where = (conditions) => {
  let clause = '';
  for(const condition of conditions) {
    for (const key in condition) {
      let sqlStr;
      if (!isNaN(key)) {
        sqlStr = `id = ${key}`;
      } else if (typeof condition[key] === 'string') {
        if (condition[key].startsWith('>')) {
          condition[key] = condition[key].substring(1);
          sqlStr = `${key} > ${condition[key]}`;
        } else if (condition[key].startsWith('<')) {
          condition[key] = condition[key].substring(1);
          sqlStr = `${key} < ${condition[key]}`;
        } else {
          sqlStr = `${key} = '${condition[key]}'`;
        }
      }
      clause = clause ? `${clause} AND ${sqlStr}` : sqlStr;
    }
  }
  return { clause };
};

const values = (conditions) => {
  const str = [];
  const params = [];
  for(const condition of conditions) {
    for (const key in condition) {
      str.push(key);
      params.push(`"${condition[key]}"`)
    }
  }
  let clause = str.join(', ');
  let args = params.join(', ')
  return { clause, args };
};


class Cursor {
  constructor(database, table, petition) {
    this.database = database;
    this.table = table;
    this.ready = false;
    this.columns = ['*'];
    this.orderBy = undefined;
    this.sql = petition;
  }

  where(conditions) {
    if(this.sql === 'DELETE') this.columns = [''];
    const { clause } = where(conditions);
    const { table, columns, orderBy, petition } = this;
    const fields = columns.join(', ');
    this.sql += ` ${fields} FROM ${table}`;
    if (clause) this.sql += ` WHERE ${clause}`;
    if (orderBy) this.sql += ` ORDER BY ${orderBy}`;
    return this;
  }

  values(conditions) {
    const { clause, args } = values(conditions);
    const { table } = this;
    this.sql += ` ${table}(${clause}) VALUES (${args})`;
    return this;
  }

  fields(list) {
    this.columns = list;
    return this;
  }

  order(name) {
    this.orderBy = name;
    return this;
  }

  then(callback) {
    const { sql } = this;
    this.database.query(sql, (err, res) => {
      if(!err) {
        callback(res);
      } else {
        console.log(err);
      };
    });
    return this;
  }
}


class Database {
  constructor(config) {
    this.pool = mysql.createPool(config);
    this.config = config;
  }

  query(sql, values, callback) {
    if (typeof values === 'function') {
      callback = values;
      values = [];
    }
    const startTime = new Date().getTime();
    this.pool.query(sql, values, (err, res) => {
      const endTime = new Date().getTime();
      const executionTime = endTime - startTime;
      console.log(`Execution time: ${executionTime}`);
      if (callback) callback(err, res);
    });
  }

  select(table) {
    this.petition = `SELECT`
    return new Cursor(this, table, this.petition);
  }

  insert(table) {
    this.petition = `INSERT INTO`
    return new Cursor(this, table, this.petition);
  }

  delete(table) {
    this.petition = `DELETE`
    return new Cursor(this, table, this.petition);
  }

}

module.exports = {
  open: (config) => new Database(config),
};
