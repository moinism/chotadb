# ChotaDB

> A wrapper over `window.localStorage` to use it as No-SQL DB.

ChotaDB provides a simple and elegant API to interface with `localStorage`. `localStorage` is already a great way to store and access user data but it only supports `string` to be stored. What if you could store objects and use it like a DB; create collections (like MongoDB), insert records, search, sort, update, remove ...?

#### Quick look:
ChotaDB provide methods for complete CRUDS operations.

````
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

`localStorage` is massively supported in browsers and devices currently being used and has a storage capacity [ranging from 2MB to 10MB](http://www.html5rocks.com/en/tutorials/offline/quota-research/). So why not use it in more powerful way!

### Why use it?

 * Of course, to store data on client-side
 * Cache
 * Store a copy of server DB localy for faster access
 * User's settings
 * Finally something to use in hybird apps. e.g.: Cordova
 * Whatever reason you were using `localStorage` for.


## Docs

* [Support/Compatibility](#support-compatibility)
* [Concepts](#concepts)
* [How to use it](#how-to-use-it)

## Support/Compatibility

As this library depends upon the availablity of `localStorage` so wherever you can use `localStorage`, you can use `ChotaDB` too.

Fortunately for us, `localStorage` is supported on a wide array of devices and browsers.

It has been [supported in browsers](https://developer.mozilla.org/en/docs/Web/API/Window/localStorage#Browser_compatibility) since:

  * Chrome 4
  * FireFox 3.5
  * IE 8
  * Opera 10.50
  * Safari 4

In addition to these browsers, ChotaDB is also supported in:

  * NodeJS
  * Chrome Extensions/Apps
  * __Cordova__ (yay!)
  * [Electron](http://electron.atom.io/)


## Concepts

ChotaDB tries to folow the same concepts used in MongoDB. Similar to Mongo, you can create collections (known as tables in SQL) to store data.

### Storing
Each data record (documents in Mongo and rows in SQL) is stored as an `object` in collections. In other words, a collection is an `array` of `objects`.
So a typical collection may look like:

````
[record, record, ..., record]
````

Your data (record) can have any schema you like. You can store objects, strings, numbers, arrays and booleans. In one collection, your records do not need to follow the same schema as previous one.

For example:

If you insert one record as:

````
DB.Users.insert({
	name: 'Moin'
});
````

And second one as:

````
DB.Users.insert({
	first_name: 'Moin',
	age: 20
});
````

It is completely fine and won't produce any errors.

### Accessing

All the data will be returned as `array` of `objects`. Like:

````
[object, object, ..., object]
````

ChotaDB supports method chaining, promises, synchronous as well as asynchronous execution for some methods.

## How to use it

### Installation

Install it via package managers:

__Bower__:

````
bower install chotadb
````

In __NodeJS__:

````
npm install chotadb
````

For other web, Cordova & Chrome based projects simply download and include the file in your pages:

````
<script src="chotadb.min.js"></script>
````

### Usage

Create an instance of `ChotaDB`:

````
var Store = new ChotaDB();
````

Create a new collection (same as table in SQL):

````
var Emails = Store.create('Emails');
````
If a collection already exists with the same name then it will be returned.

Once a collection is created it becomes a `property` on `DB` instance. So in this case, you can also access it via `Store.Emails`.

Insert a record:

````
Store.Emails.insert({
  title: 'Re: New DB for client-side data',
  from: 'me@moin.im',
  time: Date.now(),
  isRead: false
}).then(function(){
  console.log('Email arrived.');
});
````

Search records:

In this case, all the unread emails

````
Store.Emails.find({
  isRead: false
}).count(function(total){
  console.log('You have', total, 'unread emails.');
});
````

Update records:

In this case, all the unread emails should be marked as read

````
Store.Emails.find({
  isRead: false
}).update({
  isRead: true
}).then(function(){
  console.log('You have do not have any unread emails.');
});
````