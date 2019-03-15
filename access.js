//access.js

module.exports.saveBook = function(db, title, author, text, callback) {
	db.collection('text').save({title:title, author:author, text:text}, callback);
};

module.exports.findBookByTitle = function(db, title, callback) {
	db.collection('text').findOne({title:title}, function(err, doc) {
		if (err || !doc)
			callback(null);
		else
			callback(doc.text);
	});
};

module.exports.findBookByTitleCached = function(db, redis, title, callback) {
	redis.get(title, function(err, reply) {
		if (err)
			callback(null);
		else if (reply) {
			console.log("reading from redis cache")
			//Book exists in cache
			callback(JSON.parse(reply));
		}
			
		else {
			//Book doesn't exist in cache - we need to query the main database
			db.collection('text').findOne({title:title}, function(err, doc) {
				if (err || !doc)
					callback(null);
				else {
					//Book found in database, save to cache and return to client
					redis.set(title, JSON.stringify(doc), function() {
                        callback(doc);
                    });
				}
			});
		}
	});
};

module.exports.updateBookByTitle = function(db, redis, title, newText, callback) {
	db.collection("text").findAndModify({title:title}, {$set:{text:text}}, function (err, doc) { 
		//Update the main database
		if(err)
			callback(err);
		else if (!doc)
			callback('Missing book');
		else {
			//Save new book version to cache
			redis.set(title, JSON.stringify(doc), function(err) {
				if(err)
					callback(err);
				else
					callback(null);
			});
		}
	});
};