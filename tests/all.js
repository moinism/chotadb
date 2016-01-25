var expect = require("chai").expect;

var ChotaDB = require("../src/chotadb.js");

describe('Init', function() {

	var DB = new ChotaDB();

	it('should be an object', function(){
		expect(DB).to.be.an('object');
	});

	it('"create" should create property on DB instance', function(){
		DB.create('Test');
		expect(DB.Test).to.not.equal(undefined);
	});

	it('"insert" should add record', function(done){
		DB.Test.insert({
			name: 'Test',
			age: null
		}).then(function (rec) {
			expect(rec).to.not.equal(undefined);
			done();
		});
	});

});
