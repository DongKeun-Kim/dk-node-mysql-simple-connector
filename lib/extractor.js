var EXT_REG =  new RegExp (/^[A-z0-9]+\.+/);

var extractSubObjects = function(results) {
	var row = null,
		key = null,
		i = 0,
		hierarchyFiled = [],
		extKey = null;
		
	for (;i < results.length ; i++) {
		row = results[i];
		
		for (key in results[i]) {
			
			extKey = EXT_REG.exec(key);
			if (extKey) {
				extKey = extKey[0].substring(extKey[0].length - 1, 0);
				if (!row[extKey]) {
					row[extKey] = {};					
				}
				row[extKey][key.replace(EXT_REG, '')] = row[key];
				delete row[key];
			}
		}
	}
	
	return results;
};

module.exports = extractSubObjects;