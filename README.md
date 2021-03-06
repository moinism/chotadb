
[![GitHub version](https://badge.fury.io/gh/moinism%2Fchotadb.svg)](https://badge.fury.io/gh/moinism%2Fchotadb)
[![npm version](https://badge.fury.io/js/chotadb.svg)](https://badge.fury.io/js/chotadb)
[![Bower version](https://badge.fury.io/bo/chotadb.svg)](https://badge.fury.io/bo/chotadb)
[![JSHint](https://img.shields.io/badge/jshint-OK-brightgreen.svg?style=flat)]()
[![Code quality](https://img.shields.io/codacy/a09c3b15ca654b758a0677681ce1c3e1.svg)](https://www.codacy.com/app/me_60/chotadb)
[![License](https://img.shields.io/badge/license-MIT%20License-blue.svg?style=flat)](https://github.com/moinism/chotadb/blob/master/LICENSE.md)

# ChotaDB

> A wrapper over `window.localStorage` to use it as No-SQL DB.


ChotaDB provides a simple and elegant API to interface with `localStorage`. `localStorage` is already a great way to store and access user data but it only supports `string` to be stored. What if you could store objects and use it like a DB; create collections (like MongoDB), insert records, search, sort, update, remove ...?

#### Quick look:
ChotaDB provide methods for complete CRUDS operations.

````javascript
var DB = ChotaDB();

DB.create('Users')
  .insert({ name: 'Moin' })
  .find({ name: 'Moin' })
  .update({ name: 'Moin Uddin'})
  .remove();

DB.drop('Users');
````
Nice, eh!

#### Why over localStorage?

`localStorage` is massively supported in browsers and devices currently being used and has a storage capacity <a href="http://www.html5rocks.com/en/tutorials/offline/quota-research/" target="_blank">ranging from 2MB to 10MB</a>. So why not use it in more powerful way!

### Why use it?

 * Of course, to store data on client-side
 * Cache
 * Store a copy of server DB locally for faster access
 * User's settings
 * Finally something to use in hybrid apps. e.g.: Cordova
 * Whatever reason you were using `localStorage` for.


### On this page

* [Support/Compatibility](#supportcompatibility)
* [Concepts](#concepts)
  * [Storing](#storing)
  * [Accessing](#accessing)
  * [Events](#events)
* [How to use it](#how-to-use-it)
  * [Installation](#installation)
  * [Usage](#usage)
    * [Create a new collection (same as table in SQL)](#create-a-new-collection-same-as-table-in-sql)
    * [Insert a record](#insert-a-record)
    * [Search records](#search-records)
    * [Update records](#update-records)
    * [Remove records](#remove-records)
* [To do](#to-do)
* [Resources](#resources)


## Support/Compatibility

As this library depends upon the availability of `localStorage` so wherever you can use `localStorage`, you can use `ChotaDB` too.

Fortunately for us, `localStorage` is supported on a wide array of devices and browsers.

It has been <a href="https://developer.mozilla.org/en/docs/Web/API/Window/localStorage#Browser_compatibility" target="_blank">supported in browsers</a> since:

  * Chrome 4
  * FireFox 3.5
  * IE 8
  * Opera 10.50
  * Safari 4

In addition to these browsers, ChotaDB is also supported in:

  * NodeJS
  * Chrome Extensions/Apps
  * __Cordova__ (yay!) :sparkles:
  * <a href="http://electron.atom.io/" target="_blank">Electron</a>


## Concepts

ChotaDB tries to follow the same concepts used in MongoDB. Similar to Mongo, you can create collections (known as tables in SQL) to store data.

### Storing
Each data record (documents in Mongo and rows in SQL) is stored as an `object` in collections. In other words, a collection is an `array` of `objects`.
So a typical collection may look like:

````
[record, record, ..., record]
````

Your data (record) can have any schema you like. You can store objects, strings, numbers, arrays and booleans. In one collection, your records do not need to follow the same schema as previous one.

For example:

If you insert one record as:

````javascript
DB.Users.insert({
  name: 'Moin'
});
````

And second one as:

````javascript
DB.Users.insert({
  first_name: 'Moin',
  age: 20
});
````

It is completely fine and won't produce any errors. All the data is encoded to JSON and then stored in `localStorage`.

### Accessing

Similar to Mongo's cursor, ChotaDB creates a set of data for operations. Every method called on a collection can access and modify that set.

For example, current data set in a collection named `guys` looks like this:

```javascript
[{
  _id: 1,
  name: "John",
  age: 16
},{
  _id: 2,
  name: "Doe",
  age: 18
}
},{
  _id: 3,
  name: "Smith",
  age: 22
}]
```

And we perform a `find` on it to search for all the guys who are 18 years of age or older:
```javascript
DB.guys.find({
  age: {
    $gte: 18
  }
});
```

Data set would become:

```javascript
[{
  _id: 2,
  name: "Doe",
  age: 18
}
},{
  _id: 3,
  name: "Smith",
  age: 22
}]
```

So all the operations performed will affect this set only. Let's say we update it and add a field name `isAdult` to all those.

```javascript
DB.guys.find({
  age: {
    $gte: 18
  }
}).update({
  isAdult: true
});
```

Current data set would something like:

```javascript
[{
  _id: 2,
  name: "Doe",
  age: 18,
  isAdult: true
}
},{
  _id: 3,
  name: "Smith",
  age: 22,
  isAdult: true
}]
```

All the methods on a collection would perform operation on data and return the collection itself except `get` and `count` which return the current data set and number of records in it, respectively.

All the data will be returned as an `array` of `objects`. Like:

````
[object, object, ..., object]
````

ChotaDB supports method chaining, promises, synchronous as well as asynchronous execution for some methods.

### Events

ChotaDB supports a set of that you can subscribe to.

  * `error` : When there is an error execution of any command
  * `created` : When a new collection is created
  * `inserted` : When a new record is inserted into a collection
  * `updated` : When a record is changed
  * `removed` : When a record is removed from a collection
  * `dropped` : When a collection is dropped/deleted

More details about events can be read on [API wiki site](https://github.com/moinism/chotadb/wiki/Events).

You can use the `on` method on `ChotaDB` instance to subscribe to any event.

```javascript
  var DB = ChotaDB();

  DB.on('error', function(err) {
    console.error(err);
  }).on('created', function(res) {
    console.log(res);
  }).on('inserted', function(res) {
    console.log(res);
  }).on('updated', function(res) {
    console.log(res);
  }).on('removed', function(res) {
    console.log(res);
  }).on('dropped', function(res) {
    console.log(res);
  });
```


## How to use it

### Installation

Install it via package managers:

__Bower__:

````bash
bower install chotadb
````

Then include in your file:


````html
<script type="text/javascript" src="bower_components/chotadb/build/chotadb.min.js"></script>
````


In __NodeJS__:

````bash
npm install chotadb
````

Then require it like:

````javascript
var ChotaDB = require('chotadb');
````

For other web, Cordova & Chrome based projects simply <a href="https://raw.githubusercontent.com/moinism/chotadb/master/build/chotadb.min.js" target="_blank">download</a> and include the file in your pages:

````html
<script src="chotadb.min.js"></script>
````

### Usage

Below is an quick overview of what can be done with ChotaDB. For more details, please [read API docs](https://github.com/moinism/chotadb/wiki).

Start with creating an instance of `ChotaDB`:

````javascript
var Store = new ChotaDB();
````

##### Create a new collection (same as table in SQL):

````javascript
var Emails = Store.create('Emails');
````
If a collection already exists with the same name then its instance will be returned.

Once a collection is created it becomes a `property` on `DB` instance. So in this case, you can also access it via `Store.Emails`.

##### Insert a record:

````javascript
Store.Emails.insert({
  title: 'Re: New DB for client-side data',
  from: 'me@moin.im',
  tags: ['Personal','JS','Client-side'],
  time: Date.now(),
  isRead: false
}).then(function(){
  console.log('Email arrived.');
});
````

Data inserted into the collection would look something like this:

````javascript
{
  _id: 1,
  title: "Re: New DB for client-side data",
  from: "me@moin.im",
  tags: ['Personal','JS','Client-side'],
  time: 1451302067412,
  isRead: false
}
````

Notice the extra `_id` key. It is a reserved key name and is used by ChotaDB to take care of unique and auto-incrementing ID for records in a collection.
It is different from MongoDB because MongoDB creates a 12 byte (24 hex characters) string for `_id` but ChotaDB creates an integer.

> You cannot set or change the `_id`. It will be overwritten even if you did. Use any other key name like `id` if you have to.

##### Search records:
Each collections has a method `find` which can be used for searching.

So for example we wanted to know the number of emails which are unread we'll do something like this:

````javascript
Store.Emails.find({
  isRead: false
}).count(function(total){
  console.log('You have', total, 'unread emails.');
});
````
`find` will look for all the records having their `isRead` set to `false`.

If we wanted to access all the emails, we'll call `find` without any search criteria (`object`) being passed to it.

````javascript
Store.Emails.find().each(function(email){
  console.log('Email:', email.title);
});
````
`each` iterates over all the records returned.

If we wanted to find the ones having `JS` tag

````javascript
Store.Emails.find({
  tags: 'JS'
}).each(function(email){
  console.log('JS Email:', email.title);
});
````

Or the ones having both `Personal` & `JS` tags.

````javascript
Store.Emails.find({
  tags: ['Personal', 'JS']
}).each(function(email){
  console.log('Personal JS Email:', email.title);
});
````

##### Update records:
To update a record, `update` method can be chained to `find` to update all the records returned by `find`.

So for example, we want all the unread emails to be marked as read

````javascript
Store.Emails.find({
  isRead: false
}).update({
  isRead: true
}).then(function(){
  console.log('All the emails are marked as read.');
});
````

##### Remove records:
Let's delete all the emails older than a month.

````javascript
var nowTime = Date.now();
Store.Emails.find().filter(function(record){
  if( nowTime - record.time >= 2678400000) // 31 days
    return true; // we want to keep this record for next method i.e: remove
})
.remove() // remove the ones we filtered
.then(function(){
  console.log('You do not have any emails older than a month.');
});
````
# To do

This library is still not complete and lacks a few things.

 - [x] Make it work on Node issue:#1
 - [ ] Make it work on Chrome extension issue:#2
 - [ ] Make it work on Electron issue:#3
 - [ ] Write tests for all methods
 - [ ] Add continues integration (Travis CI)
 - [x] Register on npm
 - [ ] Document all API
 - [ ] Create site
 - [ ] A main demo
 - [ ] Provide more examples

### Resources

For further reading and a deeper look into how to use ChotaDB, please read [API docs](https://github.com/moinism/chotadb/wiki).
