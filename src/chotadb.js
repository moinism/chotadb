/*jshint es5: true */

;(function (_global) {

  'use strict';

  var _meta     = {}, // to hold _global meta
      _events   = [], // events and callback store
      _opts     = {}, // config object passed to constructor
      _storage  = null, // localStorage or chrome.storage.* in case of extension/app
      _SEPERATOR = '/',
      _chotaObj = { // to be returned
          SORT: {
            ASC: 1,
            DSC: -1
          },
          create: _createCollection,
          drop: _dropCollection,
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
        throw new TypeError(' this is null or not defined');
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
    else if( typeof s1 == 'string' && typeof s2 == 'string' )
      return s1.toLowerCase() == s2.toLowerCase();
    else if( typeof s1 == 'string' && Array.isArray(s2) ) // for 'PHP' = ['PHP','Python','Perl'] like comparison
      return s2.indexOf(s1) > -1;
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
    return _meta[name] !== undefined ? true : false;
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
    return _setData(_resolveName('Meta'), _meta);
  }

  function _sort (data, options) {

    if( (options === 1 || options === -1) ) {
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

    if(options.skip && options.skip > 0)
      if(options.limit && options.limit > 0)
        options.limit += options.skip;

    return data.slice(options.skip, options.limit);
  }

  function _init (meta) {
    _meta = meta; // keep a reference for _global usage
    for (var d in _meta)
      _chotaObj[d] = new ColCTRL(d);

    return;
  }

  function ColCTRL (colName) {

    var _m = _meta[colName], // meta for current collection
        _d = _getData( _resolveName(colName, 'Data') ), // original data
        _c = _d; // current set of data being operated

    function _rebase (current) {
      _setData( _resolveName(colName, 'Data'), _d );
      _d = _getData( _resolveName(colName, 'Data') );

      if(current)
        _c = _d;
    }

    var _methods = {
      get data () { return _getData( _resolveName(colName, 'Data') ); },
      all: function() {
        _c = _d;
        return this;
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
      find: function(search, options) {
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
                  search[_k] === undefined || // when .ANY is used
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

        var affected = 0;

        _c.forEach(function(record, index) {

          for(var _k in newData) {
            if(_k != '_id')
              record[_k] = newData[_k];
          }

          _d[index] = _c[index] = record;
          affected++;

        });

        _rebase();
        _trigger('updated',{
          collection: colName,
          change: newData,
          appliedTo: affected
        });
        return this;
      },
      remove: function() {

        var removed = 0;

        _d.forEach(function(recordOriginal, index) {

          _c.forEach(function(recordCurrent) {
            if(recordCurrent._id  == recordOriginal._id) {
              _d.splice(index, 1);
              removed++;
              _m.total--;
            }
          });

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
      each: function(f) {

        for( var k in _c ) {
           f( _c[k] );
        }

        return this;
      },
      filter: function(f) {

        var _temp = _c;
        _c        = [];

        _temp.forEach(function(record) {
          if( f( record ) === true )
            _c.push(record);
        });

        return this;
      },
      first: function(f) {
        if(f && typeof f == 'function') {
          f.call( null, [_c[0]] );
          return this;
        } else
          return [_c[0]];
      },
      last: function(f) {
        if(f && typeof f == 'function') {
          f.call( null, [_c[ _c.length -1 ]] );
          return this;
        } else
          return [_c[ _c.length -1 ]];
      },
      sort: function(options) {
        _c = _sort(_c, options);
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
      count: function(f) {
        if(f && typeof f == 'function') {
          f.call( null, _count(_c) );
          return this;
        } else
          return _count(_c);
      },
      then: function(f) {
        if(f && typeof f == 'function') {
          f.call( this, _c );
          return this;
        }

        return this;
      },
      get: function(f) {
        if(f && typeof f == 'function') {
          f.call(null, _c);
          return this;
        } else
          return _c;
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
        _storage.setItem( colName, JSON.stringify( data ) );
        return data;
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