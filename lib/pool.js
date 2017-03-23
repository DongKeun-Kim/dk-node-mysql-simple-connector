
var mysql = require("mysql");
var extractor = require('./extractor');
var Connection = require('mysql/lib/Connection');

function Pooler() {
	if (!this.pool) {
		this.pool = null;
	}
	
}

Pooler.prototype.pool = () => {
	if (this.pool) {
		return this.pool;
	}
	
	throw new Error("MySql Pooler Not Init");
};

Pooler.prototype.setup = (config, mode, logger) => {
	var isDebug = mode && mode === 'debug',
		queryFunc = null;
	
	this.pool = mysql.createPool(config);
	queryFunc = this.pool.query;
	
	this.logger = logger;
	
	var self = this;
	
	this.pool.query = function (sql, values, cb) {
		 return queryFunc.call(this, sql, values, function(err, results, field) {
			if (results && Array.isArray(results)) {
				results = extractor(results);
			}
			cb(err, results, field);
		});
	};
	
	
	var connFunc = this.pool.getConnection;
	this.pool.getConnection = function (cb) {
		connFunc.call(this, function(err, connection) {
			var connQuery = connection.query;
			
			if (!connection._tType) {
				connection._tType = 1;
				
				connection.query = function(sql, values, connCb) {
					connQuery.call(this, sql, values, function(err, results, field) {
						if (results && Array.isArray(results)) {
							results = extractor(results);
						}
						
						connCb(err, results, field);
					});
				}
			}
			
			cb(err, connection);
		})
	};
	
	
	this.pool.config.connectionConfig.queryFormat = function (query, values) {
		var res = "";
		
		if (!values) {
			if (isDebug) {
				if (self.logger) {
					self.logger.debug("[MySqL] Query Arguments ---> Empty");
					self.logger.debug("[MySqL] Query Statement --->\n" + query);
				}
				else {
					console.log("§§ Query Arguments ---> Empty");
					console.log("§§ Query Statement --->\n" + query);
				}
			}
			return query;
		}
		
		if (isDebug) {
			if (self.logger) {
				self.logger.debug("[MySqL] Query Arguments ---> Empty");
				self.logger.debug("[MySqL] Query Pre Statement --->\n" + query);
			}
			else {
				console.log("§§ Query Arguments ---> " + JSON.stringify(values));
				console.log("§§ Query Pre Statement --->\n" + query);
			}
		}
		
		res = mysql.format(query, values);
		
		if (!Array.isArray(values) ) {
			var res = res.replace(/\:(\w+)/g, function (txt, key) {
				if (values.hasOwnProperty(key)) {
					return this.escape(values[key]);
				}
				return txt;
				
			}.bind(this));
		}
		
		if (isDebug) {
			if (self.logger) {
				self.logger.debug("[MySqL] Query After Statement --->\n" + res);
			}
			else {
				console.log("§§ Query After Statement --->\n" + res);
			}
		}
		return res;
	};
	
	return this.pool;
};

module.exports = new Pooler();