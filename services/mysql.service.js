// Pool de conexiones a MySQL, compartido por todos los DAO
const mysql = require('mysql2/promise');
const config = require('../env/mysqlConfig');

const pool = mysql.createPool(config);

module.exports = pool;
