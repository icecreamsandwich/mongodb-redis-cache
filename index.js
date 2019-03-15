//index.js

var express = require('express'),
MongoClient = require('mongodb').MongoClient,
app = express(),
mongoUrl = 'mongodb://localhost:27017/textmonkey';
	
var redisClient = require('redis').createClient;
var redis = redisClient(6379, "localhost");

var access = require('./access.js');

var bodyParser = require('body-parser')
//midddlewares
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())


MongoClient.connect(mongoUrl, function(err, db) {
	if (err)
		throw 'Error connecting to database - ' + err;
	else {
		console.log("connected to mongo !")
	}
	//default route
	app.get('/', function(req,res){
		res.status(201).send("Welcome to redis mongo");
	});

	app.post('/book', function(req,res) {
		if (!req.body.title || !req.body.author)
			res.status(400).send("Please send a title and an author for the book");
		else if (!req.body.text)
			res.status(400).send("Please send some text for the book");
		else {
			access.saveBook(db, req.body.title, req.body.author, req.body.text, function(err) {
				if (err)
					res.status(500).send("Server error");
				else
					res.status(201).send("Saved");
			});
		}
	});
	
	app.get('/book/:title', function(req,res) {
		if (!req.param('title'))
			res.status(400).send("Please send a proper title");
		else {
			access.findBookByTitleCached(db, redis, req.param('title'), function(book) {
				if (!book)
					res.status(500).send("Server error");
				else
					res.status(200).send(book);
			});
		}
	});

	app.put('/book/:title', function(req,res) {
		if(!req.param("title"))
			res.status(400).send("Please send the book title");
		else if (!req.param("text"))
			res.status(400).send("Please send the new text");
		else {
			access.updateBookByTitle(db, redis, req.param("title"), req.param("text"), function(err) {
				if(err == "Missing book")
					res.status(404).send("Book not found");
				else if(err)
					res.status(500).send("Server error");
				else
					res.status(200).send("Updated");
			});
		}
	});
	
	app.listen(8000, function() {
		console.log('Listening on port 8000');
	});
});