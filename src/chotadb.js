/*jshint es5: true */

;(function (_global) {

  'use strict';

  var _meta     = {}, // to hold global meta
      _events   = [], // events and callback store
      _opts     = {}, // config object passed to constructor
      _storage  = null, // localStorage or chrome.storage.* in case of extension/app
      _SEPERATOR = '/',
      _chotaObj = { // to be returned
          ALL: Infinity,
          ANY: Infinity,
          SORT: {
            ASC: 1,
            DSC: -1
          },
          create: _createCollection,
          drop: _dropCollection,
          each: _collectionIterator,
          hasCollection: _isCollection,
          on: _on
      },
      _chota    = function(opts) { // constructor
        opts = opts || {}; // not using it. just future-proofing
        return _chotaObj;
      };

  /* start polyfills */

  // for < IE9 Array.isArray support: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray#Polyfill
  if (!Array.isArray) {
    Array.isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }

  // for < IE9 Array.forEach support: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
      var T, k;
      if (this === null) {
        throw new TypeError('this is null or not defined');
      }
      var O = Object(this);
      var len = O.length >>> 0;
      if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
      }
      if (arguments.length > 1) {
        T = thisArg;
      }
      k = 0;
      while (k < len) {
        var kValue;
        if (k in O) {
          kValue = O[k];
          callback.call(T, kValue, k, O);
        }
        k++;
      }
    };
  }

  // check if one array is subset of another: http://stackoverflow.com/a/8632144/1227747
  Array.prototype.containsArray = function ( array ) {

      var index = null,
          last  = null;

      if( arguments[1] ) {
          index = arguments[1]; last = arguments[2];
      } else {
          index = 0; last = 0; this.sort(); array.sort();
      }

      return index == array.length ||
             ( last = this.indexOf( array[index], last ) ) > -1 &&
             this.containsArray( array, ++index, ++last );
  };

  /* End polyfills */

  function _resolveName (colName, type) {
    return 'ChotaDB' + (type ? _SEPERATOR + type : '') + _SEPERATOR + colName;
  }

  function _on (event, callback) {
    _events[event] = callback;
    return _chotaObj;
  }

  function _trigger (event, data) {
    if(typeof _events[event] == 'function')
      _events[event](data);
  }

  function _match (s1, s2) {
    if( s1 == s2 )
      return true;
    else if( typeof s1 === 'string' && typeof s2 === 'string' )
      return s1.toLowerCase() == s2.toLowerCase();
    else if( typeof s1 === 'string' && Array.isArray(s2) ) // for 'PHP' = ['PHP','Python','Perl'] like comparison
      return s2.indexOf(s1) > -1;
    else if( Array.isArray(s1) && !Array.isArray(s2) ) // for ['PHP','Python','Perl'] = 'PHP' like comparison. logical OR
      return s1.indexOf(s2) > -1;
    else if( Array.isArray(s1) && Array.isArray(s2) ) // for ['PHP','Perl'] = ['PHP','Python','Perl'] like comparison
      return s2.containsArray(s1);
    else
      return false;
  }

  function _count (target) {
    if(Array.isArray(target) || typeof target == 'string')
      return target.length;
    else if(typeof target == 'object')
      return Object.keys(target).length;
  }

  function _isCollection (name) {
    return _meta[name] !== undefined;
  }

  function _createCollection (name) {

    if( _isCollection(name) )
      return new ColCTRL(name);
  
    _meta[name] = {
      total: 0,
      nextKey: 1
    };

    _setData(_resolveName(name, 'Data'), []);
    _updateMeta();
    _trigger('created', {collection: name});

    return _chotaObj[name] = new ColCTRL(name);
  }

  function _dropCollection (name) {

    if( !_isCollection(name) ) {
      _trigger('error', {
        reason: 'Collection does not exists.'
      });
      return _chotaObj;
    }

    delete _meta[name];
    delete _chotaObj[name];
    _removeData( _resolveName(name, 'Data') );
    _updateMeta();
    _trigger('dropped', {
      collection: name
    });
    return _chotaObj;
  }

  function _updateMeta () {
    return _meta = _setData(_resolveName('Meta'), _meta);
  }

  function _getUnique (data, key) {

     var _has = []
     , _ret   = [];

     data.forEach(function(record) {

        if( _has[record[key]] === undefined ) {
          _has[record[key]] = 1;
          _ret.push(record);
        }

     });

     return _ret;

  }

  function _sort (data, options) {

    if(!options) {
      options = {
        key: '_id',
        type: 1
      };
    } else if( (options === 1 || options === -1) ) {
      options = {
        key: '_id',
        type: options
      };
    } else if(typeof options === 'object') {
      var _key = Object.keys(options)[0];
      options = {
          key: _key,
          type: options[_key]
      };
    }

    // slightly modified version of: http://stackoverflow.com/a/1129270/1227747
    return data.sort(function (a,b) {
      if (a[options.key] < b[options.key])
        return -1 * options.type;
      if (a[options.key] > b[options.key])
        return 1 * options.type;
      return 0;
    });

  }

  function _applyOpts (data, options) {

    // no options, nothing to apply
    if(
      !options ||
      typeof options != 'object' ||
      options === null
    )
      return data;

    if(options.sort)
        data = _sort(data, options.sort);

    if(options.unique)
      data = _getUnique(data, options.unique);

    if(options.skip && options.skip > 0)
      if(options.limit && options.limit > 0)
        options.limit += options.skip;

    return data.slice(options.skip, options.limit);
  }

  function _init (meta) {
    _meta = meta; // keep a reference for global usage

    _collectionIterator(function(colName) {
      _chotaObj[colName] = this;
    });

    return;
  }

  function _collectionIterator (fn) {
    for (var _d in _meta)
      fn.call( new ColCTRL(_d), _d );
  }

  function ColCTRL (colName) {

    var _m        = _meta[colName], // meta for current collection
        _d        = _getData( _resolveName(colName, 'Data') ), // original data
        _doingAnd = false, // so we don't reset current data set in find 
        _c        = _d; // current set of data being operated

    function _rebase (current) {
      _d =_setData( _resolveName(colName, 'Data'), _d );
      if(current)
        _c = _d;
    }

    function _loopOnD (id, fn) {
      _d.forEach(function(recordOriginal, index) {
        if( recordOriginal._id === id ) {
          fn(recordOriginal, index);
        }
      });
      return;
    }

    function _applyCallback (fn, data, that) {
      if(fn && typeof fn === 'function'){
        fn.call(null, data);
        return that;
      } else
        return data;
    }

    function _updateRecord (record, newData) {

      _loopOnD(record._id, function(recordOriginal, index) {
        for(var _k in newData) {
            if(_k != '_id') {
              record[_k] = newData[_k];
            }
        }
        _d[index] = record;
      });

      return record;
    }

    function _removeRecord (record) {

      _loopOnD(record._id, function(recordOriginal, index) {
        _d.splice(index, 1);
        _m.total--;
      });

    }

    function RecordCTRL ( recordIndex ) {
      var _rec = _c[recordIndex];

      var _recCtrl = {
        get data () { return _rec; },
        update: function(newData) {

          _rec = _updateRecord( _rec, newData );

          _rebase();
          _trigger('updated',{
            collection: colName,
            change: newData,
            affected: [_rec._id] // array. to keep consistency in event data
          });

          return this;
        },
        remove: function() {

          _removeRecord( _rec );

          _meta[colName] = _m;
          _updateMeta();
          _rebase(true);
          _trigger('removed',{
            collection: colName,
            removed: [_rec._id]
          });

          return this;
        }

      };

      return _recCtrl;
    }

    var _methods = {
      get data () {
        return _getData( _resolveName(colName, 'Data') );
      },
      get info () {
        var _info = _m;
        _info.name = colName;

        return _info;
      },
      get all () {
        _c = _d;
        return this;
      },
      get keys () {
        // var _keys = [];
        // _d.forEach(function(record) {
        //     Object.keys(record).forEach(function(key) {
        //       if(_keys[key] === undefined) {
        //         console.log(_keys[key]);
        //         _keys[key] = 1;
        //       }
        //     });
        // });
        // return _keys;
      },
      insert: function(data) {
        data._id = _m.nextKey++;
        _d.push(data);
        _m.total++;
        _meta[colName] = _m;
        _updateMeta();
        _rebase(true);
        _trigger('inserted', {
          collection: colName,
          data: data
        });
        return this;
      },
      bulkInsert: function(dataArray) {
        if( Array.isArray(dataArray) )
          dataArray.forEach(this.insert);
        else
          _trigger('error', {
            reason: "bulkInsert expects an array, '" + typeof dataArray + "' was given instead."
          });

        return this;
      },
      replicateTo: function(collection) {
        collection.bulkInsert( this.all.get() );
        return this;
      },
      replicateFrom: function(collection) {
        this.bulkInsert( collection.all.get() );
        return this;
      },
      or: function(search, options) {
        var _temp = _c;

        _c = _d;
        if( this.find(search, options) )
          _c = _temp.concat(_c);

        return this;
      },
      and: function(search, options) {
        _doingAnd = true;
        this.find(search, options);
        _doingAnd = false;
        return this;
      },
      find: function(search, options) {

        if(!_doingAnd)
          _c = _d;

        options  = options || {};

        // when {}, null or nothing is passed to find
        if(!search || search === null || (search !== null && typeof search == 'object' && _count(search) === 0) ) {
          // do nothing as all the data is in _c

          _c = _applyOpts(_d, options);
          return this;
        } else {
          // reduce _c to only searched data

          var _temp = _c;
          _c = [];

          _temp.forEach(function(record) {

            for(var _k in search) {

               if(
                record[_k] !== undefined &&
                (
                  search[_k] === Infinity || // when .ANY is used
                  _match(search[_k], record[_k])
                )
              )
                _c.push(record);
            }

          });

          _c = _applyOpts(_c, options);
          return this;
        }
      },
      update: function(newData) {

        if(!newData || typeof newData !== 'object')
          return;

        var affected = [];

        _c.forEach(function(recordCurrent, indexCurrent) {

          _c[indexCurrent] = _updateRecord( recordCurrent, newData );
          affected.push( recordCurrent._id );

        });

        _rebase();
        _trigger('updated',{
          collection: colName,
          affected: affected,
          change: newData
        });

        return this;
      },
      remove: function() {

        var removed = [];

        _c.forEach(function(recordCurrent) {
            _removeRecord( recordCurrent );
            removed.push( recordCurrent._id );
        });

        _meta[colName] = _m;
        _updateMeta();
        _rebase(true);
        _trigger('removed',{
          collection: colName,
          removed: removed
        });
        return this;
      },
      findById: function(id) {

        return this.find({
          _id: id
        },{
          limit: 1
        });

      },
      findOne: function(search) {

        return this.find(search,{
          limit: 1
        });

      },
      each: function(fn) {

        _c.forEach(function(record, index) {
           fn.call( new RecordCTRL(index), record );
        });

        return this;
      },
      filter: function(fn) {

        var _temp = _c;
        _c        = [];

        _temp.forEach(function(record) {
          if( fn.call( this, record ) === true )
            _c.push(record);
        });

        return this;
      },
      get first () {
        _c = [_c[0]];
        return this;
      },
      get last () {
        _c = [_c[ _c.length -1 ]];
        return this;
      },
      sort: function(options) {
        _c = _sort(_c, options);
        return this;
      },
      unique: function(key) {
        _c = _getUnique(_c, key);
        return this;
      },
      skip: function(n) {
        _c  = _c.slice(n);
        return this;
      },
      limit: function(n) {
        _c  = _c.slice(0,n);
        return this;
      },
      count: function(fn) {
        return _applyCallback(fn, _count(_c), this);
      },
      then: function(fn) {
        if(fn && typeof fn === 'function') {
          fn.call( this, _c );
          return this;
        }

        return this;
      },
      get: function(fn) {
        return _applyCallback(fn, _c, this);
      }
    };

    //aliasing
    _methods.where  = _methods.find;

    return _methods;
  }

  var _getData
  , _setData
  , _removeData = null;

  function _initSorage (env) {
    _storage = env;

      _getData = function (colName) {
        return JSON.parse( _storage.getItem(colName) );
      };

      _setData = function (colName, data) {
        var _temp = JSON.stringify( data );
        _storage.setItem( colName, _temp );
        return JSON.parse( _temp ); // to clear out undefined-as-value records
      };

      _removeData = function (colName) {
        _storage.removeItem( colName );
      };

    _initData();
  }

  function _initData () {
    if( _storage.getItem( _resolveName('Meta') ) === undefined ) {
        _init(
          _setData(_resolveName('Meta'), {})
        );
    } else {
      _init(
        _getData(_resolveName('Meta'))
      );
    }
  }

  // NodeJS support
  if(typeof module === 'object' && module && typeof module.exports === 'object') {  
    _SEPERATOR = '-';
    var _s = require('node-persist');
    _s.initSync({
      dir: process.env.PWD + '/ChotaData',
      stringify: function(d) { return d; },
      parse: function(d) { return d; }
    });
    _initSorage( _s );
    module.exports = _chota;
    _s = null;
  } else if (_global.chrome && chrome.runtime && chrome.runtime.id){ // For Chrome extension envoirnment. : http://stackoverflow.com/a/22563123/1227747
    _initSorage();
  } else if( _global.localStorage ) {
    _initSorage( _global.localStorage );
    // expose to window
    _global.ChotaDB = _chota;

    // AMD (RequireJS) support
    if (typeof define === 'function' && define.amd) {
      define('ChotaDB', [], function() {
        return _chota;
      });
    }
  }


})(this);