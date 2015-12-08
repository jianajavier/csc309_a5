var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require('../config');

describe('Routing', function() {
  var url = 'http://boiling-hollows-5443.herokuapp.com';
  // within before() you can run all the operations that are needed to setup your tests. In this case
  // I want to create a connection with the database, and when I'm done, I call done().
  before(function(done) {
    // In our tests we use the test db
    mongoose.connect(config.db.mongodb);
    done();
  });
  // use describe to give a title to your test suite, in this case the tile is "Account"
  // and then specify a function in which we are going to declare all the tests
  // we want to run. Each test starts with the function it() and as a first argument
  // we have to provide a meaningful title for it, whereas as the second argument we
  // specify a function that takes a single parameter, "done", that we will use
  // to specify when our test is completed, and that's what makes easy
  // to perform async test!
  describe('Account', function() {
    it('should create user (if mocha test only ran once)', function(done) {
      var profile = {
        email: 'test@gmail',
        password: 'test',
      };
    // once we have specified the info we want to send to the server via POST verb,
    // we need to actually perform the action on the resource, in this case we want to
    // POST on /api/profiles and we want to send some info
    // We do this using the request object, requiring supertest!
    request(url)
	.post('/users')
	.send(profile)
    // end handles the response
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          // this is should.js syntax, very clear
          res.status.should.be.equal(200);
          done();
        });
    });
    it('should correctly update an existing account', function(done){
	var body = {
		description: 'this is a unit test',
		displayname: 'display name test'
	};
	request(url)
		.put('/users/update/test@gmail/none')
		.send(body)
		//.expect('Content-Type', /json/)
		.expect(200) //Status code
		.end(function(err,res) {
			if (err) {
				throw err;
			}
			// Should.js fluent syntax applied
			res.body.should.have.property('_id');
	                res.body.description.should.equal('this is a unit test');
	                res.body.displayName.should.equal('display name test');
	                //res.body.creationDate.should.not.equal(null);
			done();
		});
	});
  });
});
