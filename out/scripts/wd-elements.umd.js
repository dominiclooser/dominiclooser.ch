(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.WDElements = {}));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	(function (global, undefined$1) {

	    if (global.setImmediate) {
	        return;
	    }

	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var registerImmediate;

	    function setImmediate(callback) {
	      // Callback can either be a function or a string
	      if (typeof callback !== "function") {
	        callback = new Function("" + callback);
	      }
	      // Copy function arguments
	      var args = new Array(arguments.length - 1);
	      for (var i = 0; i < args.length; i++) {
	          args[i] = arguments[i + 1];
	      }
	      // Store and register the task
	      var task = { callback: callback, args: args };
	      tasksByHandle[nextHandle] = task;
	      registerImmediate(nextHandle);
	      return nextHandle++;
	    }

	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }

	    function run(task) {
	        var callback = task.callback;
	        var args = task.args;
	        switch (args.length) {
	        case 0:
	            callback();
	            break;
	        case 1:
	            callback(args[0]);
	            break;
	        case 2:
	            callback(args[0], args[1]);
	            break;
	        case 3:
	            callback(args[0], args[1], args[2]);
	            break;
	        default:
	            callback.apply(undefined$1, args);
	            break;
	        }
	    }

	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(runIfPresent, 0, handle);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    run(task);
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }

	    function installNextTickImplementation() {
	        registerImmediate = function(handle) {
	            process.nextTick(function () { runIfPresent(handle); });
	        };
	    }

	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }

	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };

	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }

	        registerImmediate = function(handle) {
	            global.postMessage(messagePrefix + handle, "*");
	        };
	    }

	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };

	        registerImmediate = function(handle) {
	            channel.port2.postMessage(handle);
	        };
	    }

	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        registerImmediate = function(handle) {
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	        };
	    }

	    function installSetTimeoutImplementation() {
	        registerImmediate = function(handle) {
	            setTimeout(runIfPresent, 0, handle);
	        };
	    }

	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();

	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();

	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();

	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6–8
	        installReadyStateChangeImplementation();

	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }

	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(typeof self === "undefined" ? typeof commonjsGlobal === "undefined" ? commonjsGlobal : commonjsGlobal : self));

	/**
	 * Copyright (c) 2019-present, GraphQL Foundation
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 * 
	 */
	// A Function, which when given an Array of keys, returns a Promise of an Array
	// of values or Errors.
	// Optionally turn off batching or caching or provide a cache key function or a
	// custom cache instance.
	// If a custom cache is provided, it must be of this type (a subset of ES6 Map).

	/**
	 * A `DataLoader` creates a public API for loading data from a particular
	 * data back-end with unique keys such as the `id` column of a SQL table or
	 * document name in a MongoDB database, given a batch loading function.
	 *
	 * Each `DataLoader` instance contains a unique memoized cache. Use caution when
	 * used in long-lived applications or those which serve many users with
	 * different access permissions and consider creating a new instance per
	 * web request.
	 */
	var DataLoader =
	/*#__PURE__*/
	function () {
	  function DataLoader(batchLoadFn, options) {
	    if (typeof batchLoadFn !== 'function') {
	      throw new TypeError('DataLoader must be constructed with a function which accepts ' + ("Array<key> and returns Promise<Array<value>>, but got: " + batchLoadFn + "."));
	    }

	    this._batchLoadFn = batchLoadFn;
	    this._maxBatchSize = getValidMaxBatchSize(options);
	    this._batchScheduleFn = getValidBatchScheduleFn(options);
	    this._cacheKeyFn = getValidCacheKeyFn(options);
	    this._cacheMap = getValidCacheMap(options);
	    this._batch = null;
	  } // Private


	  var _proto = DataLoader.prototype;

	  /**
	   * Loads a key, returning a `Promise` for the value represented by that key.
	   */
	  _proto.load = function load(key) {
	    if (key === null || key === undefined) {
	      throw new TypeError('The loader.load() function must be called with a value,' + ("but got: " + String(key) + "."));
	    }

	    var batch = getCurrentBatch(this);
	    var cacheMap = this._cacheMap;

	    var cacheKey = this._cacheKeyFn(key); // If caching and there is a cache-hit, return cached Promise.


	    if (cacheMap) {
	      var cachedPromise = cacheMap.get(cacheKey);

	      if (cachedPromise) {
	        var cacheHits = batch.cacheHits || (batch.cacheHits = []);
	        return new Promise(function (resolve) {
	          cacheHits.push(function () {
	            return resolve(cachedPromise);
	          });
	        });
	      }
	    } // Otherwise, produce a new Promise for this key, and enqueue it to be
	    // dispatched along with the current batch.


	    batch.keys.push(key);
	    var promise = new Promise(function (resolve, reject) {
	      batch.callbacks.push({
	        resolve: resolve,
	        reject: reject
	      });
	    }); // If caching, cache this promise.

	    if (cacheMap) {
	      cacheMap.set(cacheKey, promise);
	    }

	    return promise;
	  }
	  /**
	   * Loads multiple keys, promising an array of values:
	   *
	   *     var [ a, b ] = await myLoader.loadMany([ 'a', 'b' ]);
	   *
	   * This is similar to the more verbose:
	   *
	   *     var [ a, b ] = await Promise.all([
	   *       myLoader.load('a'),
	   *       myLoader.load('b')
	   *     ]);
	   *
	   * However it is different in the case where any load fails. Where
	   * Promise.all() would reject, loadMany() always resolves, however each result
	   * is either a value or an Error instance.
	   *
	   *     var [ a, b, c ] = await myLoader.loadMany([ 'a', 'b', 'badkey' ]);
	   *     // c instanceof Error
	   *
	   */
	  ;

	  _proto.loadMany = function loadMany(keys) {
	    if (!isArrayLike(keys)) {
	      throw new TypeError('The loader.loadMany() function must be called with Array<key> ' + ("but got: " + keys + "."));
	    } // Support ArrayLike by using only minimal property access


	    var loadPromises = [];

	    for (var i = 0; i < keys.length; i++) {
	      loadPromises.push(this.load(keys[i])["catch"](function (error) {
	        return error;
	      }));
	    }

	    return Promise.all(loadPromises);
	  }
	  /**
	   * Clears the value at `key` from the cache, if it exists. Returns itself for
	   * method chaining.
	   */
	  ;

	  _proto.clear = function clear(key) {
	    var cacheMap = this._cacheMap;

	    if (cacheMap) {
	      var cacheKey = this._cacheKeyFn(key);

	      cacheMap["delete"](cacheKey);
	    }

	    return this;
	  }
	  /**
	   * Clears the entire cache. To be used when some event results in unknown
	   * invalidations across this particular `DataLoader`. Returns itself for
	   * method chaining.
	   */
	  ;

	  _proto.clearAll = function clearAll() {
	    var cacheMap = this._cacheMap;

	    if (cacheMap) {
	      cacheMap.clear();
	    }

	    return this;
	  }
	  /**
	   * Adds the provided key and value to the cache. If the key already
	   * exists, no change is made. Returns itself for method chaining.
	   *
	   * To prime the cache with an error at a key, provide an Error instance.
	   */
	  ;

	  _proto.prime = function prime(key, value) {
	    var cacheMap = this._cacheMap;

	    if (cacheMap) {
	      var cacheKey = this._cacheKeyFn(key); // Only add the key if it does not already exist.


	      if (cacheMap.get(cacheKey) === undefined) {
	        // Cache a rejected promise if the value is an Error, in order to match
	        // the behavior of load(key).
	        var promise;

	        if (value instanceof Error) {
	          promise = Promise.reject(value); // Since this is a case where an Error is intentionally being primed
	          // for a given key, we want to disable unhandled promise rejection.

	          promise["catch"](function () {});
	        } else {
	          promise = Promise.resolve(value);
	        }

	        cacheMap.set(cacheKey, promise);
	      }
	    }

	    return this;
	  };

	  return DataLoader;
	}(); // Private: Enqueue a Job to be executed after all "PromiseJobs" Jobs.
	//
	// ES6 JavaScript uses the concepts Job and JobQueue to schedule work to occur
	// after the current execution context has completed:
	// http://www.ecma-international.org/ecma-262/6.0/#sec-jobs-and-job-queues
	//
	// Node.js uses the `process.nextTick` mechanism to implement the concept of a
	// Job, maintaining a global FIFO JobQueue for all Jobs, which is flushed after
	// the current call stack ends.
	//
	// When calling `then` on a Promise, it enqueues a Job on a specific
	// "PromiseJobs" JobQueue which is flushed in Node as a single Job on the
	// global JobQueue.
	//
	// DataLoader batches all loads which occur in a single frame of execution, but
	// should include in the batch all loads which occur during the flushing of the
	// "PromiseJobs" JobQueue after that same execution frame.
	//
	// In order to avoid the DataLoader dispatch Job occuring before "PromiseJobs",
	// A Promise Job is created with the sole purpose of enqueuing a global Job,
	// ensuring that it always occurs after "PromiseJobs" ends.
	//
	// Node.js's job queue is unique. Browsers do not have an equivalent mechanism
	// for enqueuing a job to be performed after promise microtasks and before the
	// next macrotask. For browser environments, a macrotask is used (via
	// setImmediate or setTimeout) at a potential performance penalty.


	var enqueuePostPromiseJob = typeof process === 'object' && typeof process.nextTick === 'function' ? function (fn) {
	  if (!resolvedPromise) {
	    resolvedPromise = Promise.resolve();
	  }

	  resolvedPromise.then(function () {
	    return process.nextTick(fn);
	  });
	} : setImmediate || setTimeout; // Private: cached resolved Promise instance

	var resolvedPromise; // Private: Describes a batch of requests

	// Private: Either returns the current batch, or creates and schedules a
	// dispatch of a new batch for the given loader.
	function getCurrentBatch(loader) {
	  // If there is an existing batch which has not yet dispatched and is within
	  // the limit of the batch size, then return it.
	  var existingBatch = loader._batch;

	  if (existingBatch !== null && !existingBatch.hasDispatched && existingBatch.keys.length < loader._maxBatchSize && (!existingBatch.cacheHits || existingBatch.cacheHits.length < loader._maxBatchSize)) {
	    return existingBatch;
	  } // Otherwise, create a new batch for this loader.


	  var newBatch = {
	    hasDispatched: false,
	    keys: [],
	    callbacks: []
	  }; // Store it on the loader so it may be reused.

	  loader._batch = newBatch; // Then schedule a task to dispatch this batch of requests.

	  loader._batchScheduleFn(function () {
	    return dispatchBatch(loader, newBatch);
	  });

	  return newBatch;
	}

	function dispatchBatch(loader, batch) {
	  // Mark this batch as having been dispatched.
	  batch.hasDispatched = true; // If there's nothing to load, resolve any cache hits and return early.

	  if (batch.keys.length === 0) {
	    resolveCacheHits(batch);
	    return;
	  } // Call the provided batchLoadFn for this loader with the batch's keys and
	  // with the loader as the `this` context.


	  var batchPromise = loader._batchLoadFn(batch.keys); // Assert the expected response from batchLoadFn


	  if (!batchPromise || typeof batchPromise.then !== 'function') {
	    return failedDispatch(loader, batch, new TypeError('DataLoader must be constructed with a function which accepts ' + 'Array<key> and returns Promise<Array<value>>, but the function did ' + ("not return a Promise: " + String(batchPromise) + ".")));
	  } // Await the resolution of the call to batchLoadFn.


	  batchPromise.then(function (values) {
	    // Assert the expected resolution from batchLoadFn.
	    if (!isArrayLike(values)) {
	      throw new TypeError('DataLoader must be constructed with a function which accepts ' + 'Array<key> and returns Promise<Array<value>>, but the function did ' + ("not return a Promise of an Array: " + String(values) + "."));
	    }

	    if (values.length !== batch.keys.length) {
	      throw new TypeError('DataLoader must be constructed with a function which accepts ' + 'Array<key> and returns Promise<Array<value>>, but the function did ' + 'not return a Promise of an Array of the same length as the Array ' + 'of keys.' + ("\n\nKeys:\n" + String(batch.keys)) + ("\n\nValues:\n" + String(values)));
	    } // Resolve all cache hits in the same micro-task as freshly loaded values.


	    resolveCacheHits(batch); // Step through values, resolving or rejecting each Promise in the batch.

	    for (var i = 0; i < batch.callbacks.length; i++) {
	      var value = values[i];

	      if (value instanceof Error) {
	        batch.callbacks[i].reject(value);
	      } else {
	        batch.callbacks[i].resolve(value);
	      }
	    }
	  })["catch"](function (error) {
	    return failedDispatch(loader, batch, error);
	  });
	} // Private: do not cache individual loads if the entire batch dispatch fails,
	// but still reject each request so they do not hang.


	function failedDispatch(loader, batch, error) {
	  // Cache hits are resolved, even though the batch failed.
	  resolveCacheHits(batch);

	  for (var i = 0; i < batch.keys.length; i++) {
	    loader.clear(batch.keys[i]);
	    batch.callbacks[i].reject(error);
	  }
	} // Private: Resolves the Promises for any cache hits in this batch.


	function resolveCacheHits(batch) {
	  if (batch.cacheHits) {
	    for (var i = 0; i < batch.cacheHits.length; i++) {
	      batch.cacheHits[i]();
	    }
	  }
	} // Private: given the DataLoader's options, produce a valid max batch size.


	function getValidMaxBatchSize(options) {
	  var shouldBatch = !options || options.batch !== false;

	  if (!shouldBatch) {
	    return 1;
	  }

	  var maxBatchSize = options && options.maxBatchSize;

	  if (maxBatchSize === undefined) {
	    return Infinity;
	  }

	  if (typeof maxBatchSize !== 'number' || maxBatchSize < 1) {
	    throw new TypeError("maxBatchSize must be a positive number: " + maxBatchSize);
	  }

	  return maxBatchSize;
	} // Private


	function getValidBatchScheduleFn(options) {
	  var batchScheduleFn = options && options.batchScheduleFn;

	  if (batchScheduleFn === undefined) {
	    return enqueuePostPromiseJob;
	  }

	  if (typeof batchScheduleFn !== 'function') {
	    throw new TypeError("batchScheduleFn must be a function: " + batchScheduleFn);
	  }

	  return batchScheduleFn;
	} // Private: given the DataLoader's options, produce a cache key function.


	function getValidCacheKeyFn(options) {
	  var cacheKeyFn = options && options.cacheKeyFn;

	  if (cacheKeyFn === undefined) {
	    return function (key) {
	      return key;
	    };
	  }

	  if (typeof cacheKeyFn !== 'function') {
	    throw new TypeError("cacheKeyFn must be a function: " + cacheKeyFn);
	  }

	  return cacheKeyFn;
	} // Private: given the DataLoader's options, produce a CacheMap to be used.


	function getValidCacheMap(options) {
	  var shouldCache = !options || options.cache !== false;

	  if (!shouldCache) {
	    return null;
	  }

	  var cacheMap = options && options.cacheMap;

	  if (cacheMap === undefined) {
	    return new Map();
	  }

	  if (cacheMap !== null) {
	    var cacheFunctions = ['get', 'set', 'delete', 'clear'];
	    var missingFunctions = cacheFunctions.filter(function (fnName) {
	      return cacheMap && typeof cacheMap[fnName] !== 'function';
	    });

	    if (missingFunctions.length !== 0) {
	      throw new TypeError('Custom cacheMap missing methods: ' + missingFunctions.join(', '));
	    }
	  }

	  return cacheMap;
	} // Private


	function isArrayLike(x) {
	  return typeof x === 'object' && x !== null && typeof x.length === 'number' && (x.length === 0 || x.length > 0 && Object.prototype.hasOwnProperty.call(x, x.length - 1));
	}

	var dataloader = DataLoader;

	var utils = {
	  // Ex: keep only 'fr' in 'fr_FR'
	  shortLang: language => language.toLowerCase().split('_')[0],

	  // a polymorphism helper:
	  // accept either a string or an array and return an array
	  forceArray: array => {
	    if (typeof array === 'string') array = [ array ];
	    return array || []
	  },

	  // simplistic implementation to filter-out arrays
	  isPlainObject: obj => {
	    if (!obj || typeof obj !== 'object' || obj instanceof Array) return false
	    return true
	  },

	  // encodeURIComponent ignores !, ', (, ), and *
	  // cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
	  fixedEncodeURIComponent: str => {
	    return encodeURIComponent(str).replace(/[!'()*]/g, encodeCharacter)
	  },

	  replaceSpaceByUnderscores: str => str.replace(/\s/g, '_'),

	  uniq: array => Array.from(new Set(array))
	};

	const encodeCharacter = char => '%' + char.charCodeAt(0).toString(16);

	const simplifyTextAttributes = multivalue => data => {
	  return Object.keys(data).reduce(aggregateValues(data, multivalue), {})
	};

	const aggregateValues = (data, multivalue) => (index, lang) => {
	  const obj = data[lang];
	  index[lang] = multivalue ? obj.map(getValue) : obj.value;
	  return index
	};

	const getValue = obj => obj.value;

	const singleValue = simplifyTextAttributes(false);

	var simplify_text_attributes = {
	  labels: singleValue,
	  descriptions: singleValue,
	  aliases: simplifyTextAttributes(true),
	  lemmas: singleValue,
	  representations: singleValue,
	  glosses: singleValue
	};

	var wikibase_time_to_date_object = wikibaseTime => {
	  // Also accept claim datavalue.value objects
	  if (typeof wikibaseTime === 'object') {
	    wikibaseTime = wikibaseTime.time;
	  }

	  const sign = wikibaseTime[0];
	  var [ yearMonthDay, withinDay ] = wikibaseTime.slice(1).split('T');

	  // Wikidata generates invalid ISO dates to indicate precision
	  // ex: +1990-00-00T00:00:00Z to indicate 1990 with year precision
	  yearMonthDay = yearMonthDay.replace(/-00/g, '-01');
	  const rest = `${yearMonthDay}T${withinDay}`;

	  return fullDateData(sign, rest)
	};

	const fullDateData = (sign, rest) => {
	  const year = rest.split('-')[0];
	  const needsExpandedYear = sign === '-' || year.length > 4;

	  return needsExpandedYear ? expandedYearDate(sign, rest, year) : new Date(rest)
	};

	const expandedYearDate = (sign, rest, year) => {
	  var date;
	  // Using ISO8601 expanded notation for negative years or positive
	  // years with more than 4 digits: adding up to 2 leading zeros
	  // when needed. Can't find the documentation again, but testing
	  // with `new Date(date)` gives a good clue of the implementation
	  if (year.length === 4) {
	    date = `${sign}00${rest}`;
	  } else if (year.length === 5) {
	    date = `${sign}0${rest}`;
	  } else {
	    date = sign + rest;
	  }
	  return new Date(date)
	};

	const helpers = {};
	helpers.isNumericId = id => /^[1-9][0-9]*$/.test(id);
	helpers.isEntityId = id => /^((Q|P|L)[1-9][0-9]*|L[1-9][0-9]*-(F|S)[1-9][0-9]*)$/.test(id);
	helpers.isItemId = id => /^Q[1-9][0-9]*$/.test(id);
	helpers.isPropertyId = id => /^P[1-9][0-9]*$/.test(id);
	helpers.isLexemeId = id => /^L[1-9][0-9]*$/.test(id);
	helpers.isFormId = id => /^L[1-9][0-9]*-F[1-9][0-9]*$/.test(id);
	helpers.isSenseId = id => /^L[1-9][0-9]*-S[1-9][0-9]*$/.test(id);
	helpers.isGuid = guid => /^((Q|P|L)[1-9][0-9]*|L[1-9][0-9]*-(F|S)[1-9][0-9]*)\$[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guid);
	helpers.isRevisionId = id => /^\d+$/.test(id);

	helpers.isEntityPageTitle = title => {
	  if (typeof title !== 'string') return false
	  var [ namespace, id ] = title.split(':');
	  if (namespace && id) {
	    return isEntityNamespace(namespace) && helpers[`is${namespace}Id`](id)
	  } else {
	    id = namespace;
	    return helpers.isItemId(id)
	  }
	};

	const entityNamespaces = [ 'Item', 'Property', 'Lexeme' ];

	const isEntityNamespace = str => entityNamespaces.includes(str);

	const isNonNestedEntityId = id => /^(Q|P|L)[1-9][0-9]*$/.test(id);

	helpers.getNumericId = id => {
	  if (!isNonNestedEntityId(id)) throw new Error(`invalid entity id: ${id}`)
	  return id.replace(/^(Q|P|L)/, '')
	};

	helpers.wikibaseTimeToDateObject = wikibase_time_to_date_object;

	// Try to parse the date or return the input
	const bestEffort = fn => value => {
	  try {
	    return fn(value)
	  } catch (err) {
	    value = value.time || value;

	    const sign = value[0];
	    let [ yearMonthDay, withinDay ] = value.slice(1).split('T');
	    yearMonthDay = yearMonthDay.replace(/-00/g, '-01');

	    return `${sign}${yearMonthDay}T${withinDay}`
	  }
	};

	const toEpochTime = wikibaseTime => wikibase_time_to_date_object(wikibaseTime).getTime();
	const toISOString = wikibaseTime => wikibase_time_to_date_object(wikibaseTime).toISOString();

	// A date format that knows just three precisions:
	// 'yyyy', 'yyyy-mm', and 'yyyy-mm-dd' (including negative and non-4 digit years)
	// Should be able to handle the old and the new Wikidata time:
	// - in the old one, units below the precision where set to 00
	// - in the new one, those months and days are set to 01 in those cases,
	//   so when we can access the full claim object, we check the precision
	//   to recover the old format
	const toSimpleDay = wikibaseTime => {
	  // Also accept claim datavalue.value objects, and actually prefer those,
	  // as we can check the precision
	  if (typeof wikibaseTime === 'object') {
	    const { time, precision } = wikibaseTime;
	    // Year precision
	    if (precision === 9) wikibaseTime = time.replace('-01-01T', '-00-00T');
	    // Month precision
	    else if (precision === 10) wikibaseTime = time.replace('-01T', '-00T');
	    else wikibaseTime = time;
	  }

	  return wikibaseTime.split('T')[0]
	  // Remove positive years sign
	  .replace(/^\+/, '')
	  // Remove years padding zeros
	  .replace(/^(-?)0+/, '$1')
	  // Remove days if not included in the Wikidata date precision
	  .replace(/-00$/, '')
	  // Remove months if not included in the Wikidata date precision
	  .replace(/-00$/, '')
	};

	helpers.wikibaseTimeToEpochTime = bestEffort(toEpochTime);
	helpers.wikibaseTimeToISOString = bestEffort(toISOString);
	helpers.wikibaseTimeToSimpleDay = bestEffort(toSimpleDay);

	helpers.getImageUrl = (filename, width) => {
	  var url = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
	  if (typeof width === 'number') url += `?width=${width}`;
	  return url
	};

	var helpers_1 = helpers;

	const { wikibaseTimeToISOString, wikibaseTimeToEpochTime, wikibaseTimeToSimpleDay } = helpers_1;

	const simple = datavalue => datavalue.value;

	const monolingualtext = (datavalue, options) => {
	  return options.keepRichValues ? datavalue.value : datavalue.value.text
	};

	const entity = (datavalue, options) => prefixedId(datavalue, options.entityPrefix);

	const entityLetter = {
	  item: 'Q',
	  lexeme: 'L',
	  property: 'P'
	};

	const prefixedId = (datavalue, prefix) => {
	  const { value } = datavalue;
	  const id = value.id || entityLetter[value['entity-type']] + value['numeric-id'];
	  return typeof prefix === 'string' ? `${prefix}:${id}` : id
	};

	const quantity = (datavalue, options) => {
	  const { value } = datavalue;
	  const amount = parseFloat(value.amount);
	  if (options.keepRichValues) {
	    const richValue = {
	      amount: parseFloat(value.amount),
	      // ex: http://www.wikidata.org/entity/
	      unit: value.unit.replace(/^https?:\/\/.*\/entity\//, '')
	    };
	    if (value.upperBound != null) richValue.upperBound = parseFloat(value.upperBound);
	    if (value.lowerBound != null) richValue.lowerBound = parseFloat(value.lowerBound);
	    return richValue
	  } else {
	    return amount
	  }
	};

	const coordinate = (datavalue, options) => {
	  if (options.keepRichValues) {
	    return datavalue.value
	  } else {
	    return [ datavalue.value.latitude, datavalue.value.longitude ]
	  }
	};

	const time = (datavalue, options) => {
	  var timeValue;
	  if (typeof options.timeConverter === 'function') {
	    timeValue = options.timeConverter(datavalue.value);
	  } else {
	    timeValue = getTimeConverter(options.timeConverter)(datavalue.value);
	  }
	  if (options.keepRichValues) {
	    const { timezone, before, after, precision, calendarmodel } = datavalue.value;
	    return { time: timeValue, timezone, before, after, precision, calendarmodel }
	  } else {
	    return timeValue
	  }
	};

	const getTimeConverter = (key = 'iso') => {
	  const converter = timeConverters[key];
	  if (!converter) throw new Error(`invalid converter key: ${JSON.stringify(key).substring(0, 100)}`)
	  return converter
	};

	// Each time converter should be able to accept 2 keys of arguments:
	// - either datavalue.value objects (prefered as it gives access to the precision)
	// - or the time string (datavalue.value.time)
	const timeConverters = {
	  iso: wikibaseTimeToISOString,
	  epoch: wikibaseTimeToEpochTime,
	  'simple-day': wikibaseTimeToSimpleDay,
	  none: wikibaseTime => wikibaseTime.time || wikibaseTime
	};

	const parsers = {
	  commonsMedia: simple,
	  'external-id': simple,
	  'geo-shape': simple,
	  'globe-coordinate': coordinate,
	  math: simple,
	  monolingualtext,
	  'musical-notation': simple,
	  quantity,
	  string: simple,
	  'tabular-data': simple,
	  time,
	  url: simple,
	  'wikibase-entityid': entity,
	  'wikibase-form': entity,
	  'wikibase-item': entity,
	  'wikibase-lexeme': entity,
	  'wikibase-property': entity,
	  'wikibase-sense': entity
	};

	var parse_claim = {
	  parsers,
	  parse: (datatype, datavalue, options, claimId) => {
	    // Known case of missing datatype: form.claims, sense.claims
	    datatype = datatype || datavalue.type;

	    try {
	      return parsers[datatype](datavalue, options)
	    } catch (err) {
	      if (err.message === 'parsers[datatype] is not a function') {
	        err.message = `${datatype} claim parser isn't implemented
        Claim id: ${claimId}
        Please report to https://github.com/maxlath/wikibase-sdk/issues`;
	      }
	      throw err
	    }
	  }
	};

	const truthyPropertyClaims = propClaims => {
	  const aggregate = propClaims.reduce(aggregatePerRank, {});
	  // on truthyness: https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#Truthy_statements
	  return aggregate.preferred || aggregate.normal || []
	};

	const aggregatePerRank = (aggregate, claim) => {
	  const { rank } = claim;
	  aggregate[rank] || (aggregate[rank] = []);
	  aggregate[rank].push(claim);
	  return aggregate
	};

	const truthyClaims = claims => {
	  const truthClaimsOnly = {};
	  Object.keys(claims).forEach(property => {
	    truthClaimsOnly[property] = truthyPropertyClaims(claims[property]);
	  });
	  return truthClaimsOnly
	};

	var rank = { truthyClaims, truthyPropertyClaims };

	const { parse: parseClaim } = parse_claim;
	const { uniq } = utils;
	const { truthyPropertyClaims: truthyPropertyClaims$1 } = rank;

	// Expects an entity 'claims' object
	// Ex: entity.claims
	const simplifyClaims = (claims, ...options) => {
	  const { propertyPrefix } = parseOptions(options);
	  const simpleClaims = {};
	  for (let id in claims) {
	    const propClaims = claims[id];
	    if (propertyPrefix) {
	      id = propertyPrefix + ':' + id;
	    }
	    simpleClaims[id] = simplifyPropertyClaims(propClaims, ...options);
	  }
	  return simpleClaims
	};

	// Expects the 'claims' array of a particular property
	// Ex: entity.claims.P369
	const simplifyPropertyClaims = (propClaims, ...options) => {
	  // Avoid to throw on empty inputs to allow to simplify claims array
	  // without having to know if the entity as claims for this property
	  // Ex: simplifyPropertyClaims(entity.claims.P124211616)
	  if (propClaims == null || propClaims.length === 0) return []

	  const { keepNonTruthy, areSubSnaks } = parseOptions(options);
	  if (!(keepNonTruthy || areSubSnaks)) {
	    propClaims = truthyPropertyClaims$1(propClaims);
	  }

	  propClaims = propClaims
	    .map(claim => simplifyClaim(claim, ...options))
	    // Filter-out novalue and somevalue claims,
	    // unless a novalueValue or a somevalueValue is passed in options
	    .filter(defined);

	  // Deduplicate values unless we return a rich value object
	  if (propClaims[0] && typeof propClaims[0] !== 'object') {
	    return uniq(propClaims)
	  } else {
	    return propClaims
	  }
	};

	// Considers null as defined
	const defined = obj => obj !== undefined;

	// Expects a single claim object
	// Ex: entity.claims.P369[0]
	const simplifyClaim = (claim, ...options) => {
	  options = parseOptions(options);
	  const { keepQualifiers, keepReferences, keepIds, keepHashes, keepTypes, keepSnaktypes, keepRanks } = parseKeepOptions(options);

	  // tries to replace wikidata deep claim object by a simple value
	  // e.g. a string, an entity Qid or an epoch time number
	  const { mainsnak, rank } = claim;

	  var value, datatype, datavalue, snaktype, isQualifierSnak, isReferenceSnak;
	  if (mainsnak) {
	    datatype = mainsnak.datatype;
	    datavalue = mainsnak.datavalue;
	    snaktype = mainsnak.snaktype;
	  } else {
	    // Qualifiers have no mainsnak, and define datatype, datavalue on claim
	    datavalue = claim.datavalue;
	    datatype = claim.datatype;
	    snaktype = claim.snaktype;
	    // Duck typing the sub-snak type
	    if (claim.hash) isQualifierSnak = true;
	    else isReferenceSnak = true;
	  }

	  if (datavalue) {
	    value = parseClaim(datatype, datavalue, options, claim.id);
	  } else {
	    if (snaktype === 'somevalue') value = options.somevalueValue;
	    else if (snaktype === 'novalue') value = options.novalueValue;
	    else throw new Error('no datavalue or special snaktype found')
	  }

	  // Qualifiers should not attempt to keep sub-qualifiers or references
	  if (isQualifierSnak) {
	    if (!(keepHashes || keepTypes || keepSnaktypes)) return value

	    const valueObj = { value };

	    if (keepHashes) valueObj.hash = claim.hash;
	    if (keepTypes) valueObj.type = datatype;
	    if (keepSnaktypes) valueObj.snaktype = snaktype;

	    return valueObj
	  }
	  if (isReferenceSnak) {
	    if (!keepTypes) return value

	    return { type: datatype, value }
	  }
	  // No need to test keepHashes as it has no effect if neither
	  // keepQualifiers or keepReferences is true
	  if (!(keepQualifiers || keepReferences || keepIds || keepTypes || keepSnaktypes || keepRanks)) {
	    return value
	  }

	  // When keeping qualifiers or references, the value becomes an object
	  // instead of a direct value
	  const valueObj = { value };

	  if (keepTypes) valueObj.type = datatype;

	  if (keepSnaktypes) valueObj.snaktype = snaktype;

	  if (keepRanks) valueObj.rank = rank;

	  const subSnaksOptions = getSubSnakOptions(options);
	  subSnaksOptions.keepHashes = keepHashes;

	  if (keepQualifiers) {
	    valueObj.qualifiers = simplifyClaims(claim.qualifiers, subSnaksOptions);
	  }

	  if (keepReferences) {
	    claim.references = claim.references || [];
	    valueObj.references = claim.references.map(refRecord => {
	      const snaks = simplifyClaims(refRecord.snaks, subSnaksOptions);
	      if (keepHashes) return { snaks, hash: refRecord.hash }
	      else return snaks
	    });
	  }

	  if (keepIds) valueObj.id = claim.id;

	  return valueObj
	};

	const parseOptions = options => {
	  if (options == null) return {}

	  if (options[0] && typeof options[0] === 'object') return options[0]

	  // Legacy interface
	  var [ entityPrefix, propertyPrefix, keepQualifiers ] = options;
	  return { entityPrefix, propertyPrefix, keepQualifiers }
	};

	const simplifyQualifiers = (claims, options) => {
	  return simplifyClaims(claims, getSubSnakOptions(options))
	};

	const simplifyPropertyQualifiers = (propClaims, options) => {
	  return simplifyPropertyClaims(propClaims, getSubSnakOptions(options))
	};

	// Using a new object so that the original options object isn't modified
	const getSubSnakOptions = options => {
	  return Object.assign({}, options, { areSubSnaks: true })
	};

	const keepOptions = [ 'keepQualifiers', 'keepReferences', 'keepIds', 'keepHashes', 'keepTypes', 'keepSnaktypes', 'keepRanks', 'keepRichValues' ];

	const parseKeepOptions = options => {
	  if (options.keepAll) {
	    keepOptions.forEach(optionName => {
	      if (options[optionName] == null) options[optionName] = true;
	    });
	  }
	  return options
	};

	var simplify_claims = {
	  simplifyClaims,
	  simplifyPropertyClaims,
	  simplifyClaim,
	  simplifyQualifiers,
	  simplifyPropertyQualifiers,
	  simplifyQualifier: simplifyClaim
	};

	const { isFormId } = helpers_1;
	const { representations: simplifyRepresentations } = simplify_text_attributes;
	const { simplifyClaims: simplifyClaims$1 } = simplify_claims;

	const simplifyForm = (form, options) => {
	  const { id, representations, grammaticalFeatures, claims } = form;
	  if (!isFormId(id)) throw new Error('invalid form object')
	  return {
	    id,
	    representations: simplifyRepresentations(representations),
	    grammaticalFeatures,
	    claims: simplifyClaims$1(claims, options)
	  }
	};

	const simplifyForms = (forms, options) => forms.map(form => simplifyForm(form, options));

	var simplify_forms = { simplifyForm, simplifyForms };

	const { isSenseId } = helpers_1;
	const { glosses: simplifyGlosses } = simplify_text_attributes;
	const { simplifyClaims: simplifyClaims$2 } = simplify_claims;

	const simplifySense = (sense, options) => {
	  const { id, glosses, claims } = sense;
	  if (!isSenseId(id)) throw new Error('invalid sense object')
	  return {
	    id,
	    glosses: simplifyGlosses(glosses),
	    claims: simplifyClaims$2(claims, options)
	  }
	};

	const simplifySenses = (senses, options) => senses.map(sense => simplifySense(sense, options));

	var simplify_senses = { simplifySense, simplifySenses };

	// Generated by 'npm run update-sitelinks-languages'
	var sitelinks_languages = [ 'aa', 'ab', 'af', 'ak', 'als', 'am', 'ang', 'an', 'ar', 'ast', 'as', 'av', 'ay', 'az', 'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs', 'ca', 'chr', 'ch', 'co', 'cr', 'csb', 'cs', 'cv', 'cy', 'da', 'de', 'dv', 'dz', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fj', 'fo', 'fr', 'fy', 'ga', 'gd', 'gl', 'gn', 'got', 'gu', 'gv', 'ha', 'he', 'hif', 'hi', 'hr', 'hsb', 'ht', 'hu', 'hy', 'ia', 'id', 'ie', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jbo', 'jv', 'ka', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kw', 'ky', 'la', 'lb', 'li', 'ln', 'lo', 'lt', 'lv', 'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mo', 'mr', 'ms', 'mt', 'my', 'nah', 'nap', 'na', 'nds', 'ne', 'nl', 'nn', 'no', 'oc', 'om', 'or', 'pa', 'pi', 'pl', 'pms', 'pnb', 'ps', 'pt', 'qu', 'rm', 'rn', 'roa_rup', 'ro', 'ru', 'rw', 'sah', 'sa', 'scn', 'sc', 'sd', 'se', 'sg', 'sh', 'simple', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tpi', 'tr', 'ts', 'tt', 'tw', 'ug', 'uk', 'ur', 'uz', 'vec', 'vi', 'vo', 'wa', 'wo', 'xh', 'yi', 'yo', 'yue', 'za', 'zh_min_nan', 'zh', 'zu', 'ace', 'arc', 'arz', 'bar', 'bat_smg', 'bcl', 'be_x_old', 'bjn', 'bpy', 'bug', 'bxr', 'cbk_zam', 'cdo', 'ce', 'ceb', 'cho', 'chy', 'ckb', 'crh', 'cu', 'diq', 'dsb', 'ee', 'eml', 'ext', 'ff', 'fiu_vro', 'frp', 'frr', 'fur', 'gag', 'gan', 'glk', 'hak', 'haw', 'ho', 'hz', 'ig', 'ii', 'ilo', 'kaa', 'kab', 'kbd', 'kg', 'ki', 'kj', 'koi', 'krc', 'ksh', 'kv', 'lad', 'lbe', 'lez', 'lg', 'lij', 'lmo', 'ltg', 'mai', 'map_bms', 'mdf', 'mhr', 'min', 'mrj', 'mus', 'mwl', 'myv', 'mzn', 'nds_nl', 'new', 'ng', 'nov', 'nrm', 'nso', 'nv', 'ny', 'os', 'pag', 'pam', 'pap', 'pcd', 'pdc', 'pfl', 'pih', 'pnt', 'rmy', 'roa_tara', 'rue', 'sco', 'srn', 'stq', 'szl', 'tet', 'tum', 'ty', 'tyv', 'udm', 've', 'vep', 'vls', 'war', 'wuu', 'xal', 'xmf', 'zea', 'zh_classical', 'zh_yue', 'lrc', 'gom', 'azb', 'ady', 'jam', 'tcy', 'olo', 'dty', 'atj', 'kbp', 'din', 'gor', 'inh', 'lfn', 'sat', 'shn', 'hyw', 'nqo', 'ban' ];

	const { fixedEncodeURIComponent, replaceSpaceByUnderscores, isPlainObject } = utils;
	const { isPropertyId } = helpers_1;
	const wikidataBase = 'https://www.wikidata.org/wiki/';


	const getSitelinkUrl = (site, title) => {
	  if (isPlainObject(site)) {
	    title = site.title;
	    site = site.site;
	  }

	  if (!site) throw new Error('missing a site')
	  if (!title) throw new Error('missing a title')

	  const shortSiteKey = site.replace(/wiki$/, '');
	  const specialUrlBuilder = siteUrlBuilders[shortSiteKey] || siteUrlBuilders[site];
	  if (specialUrlBuilder) return specialUrlBuilder(title)

	  const { lang, project } = getSitelinkData(site);
	  title = fixedEncodeURIComponent(replaceSpaceByUnderscores(title));
	  return `https://${lang}.${project}.org/wiki/${title}`
	};

	const wikimediaSite = subdomain => title => `https://${subdomain}.wikimedia.org/wiki/${title}`;

	const siteUrlBuilders = {
	  commons: wikimediaSite('commons'),
	  mediawiki: title => `https://www.mediawiki.org/wiki/${title}`,
	  meta: wikimediaSite('meta'),
	  species: wikimediaSite('species'),
	  wikidata: title => {
	    if (isPropertyId(title)) return `${wikidataBase}Property:${title}`
	    return `${wikidataBase}${title}`
	  },
	  wikimania: wikimediaSite('wikimania')
	};

	const sitelinkUrlPattern = /^https?:\/\/([\w-]{2,10})\.(\w+)\.org\/\w+\/(.*)/;

	const getSitelinkData = site => {
	  if (site.startsWith('http')) {
	    const url = site;
	    const matchData = url.match(sitelinkUrlPattern);
	    if (!matchData) throw new Error(`invalid sitelink url: ${url}`)
	    let [ lang, project, title ] = matchData.slice(1);
	    let key;
	    // Known case: wikidata, mediawiki
	    if (lang === 'www') {
	      lang = 'en';
	      key = project;
	    } else if (lang === 'commons') {
	      lang = 'en';
	      project = key = 'commons';
	    } else {
	      key = `${lang}${project}`.replace('wikipedia', 'wiki');
	    }
	    return { lang, project, key, title, url }
	  } else {
	    const key = site;
	    const specialProjectName = specialSites[key];
	    if (specialProjectName) return { lang: 'en', project: specialProjectName, key }

	    const [ lang, projectSuffix, rest ] = key.split('wik');

	    // Detecting cases like 'frwikiwiki' that would return [ 'fr', 'i', 'i' ]
	    if (rest != null) throw new Error(`invalid sitelink key: ${key}`)

	    if (sitelinks_languages.indexOf(lang) === -1) {
	      throw new Error(`sitelink lang not found: ${lang}`)
	    }

	    const project = projectsBySuffix[projectSuffix];
	    if (!project) throw new Error(`sitelink project not found: ${project}`)

	    return { lang, project, key }
	  }
	};

	const specialSites = {
	  commonswiki: 'commons',
	  mediawikiwiki: 'mediawiki',
	  metawiki: 'meta',
	  specieswiki: 'specieswiki',
	  wikidatawiki: 'wikidata',
	  wikimaniawiki: 'wikimania'
	};

	const isSitelinkKey = site => {
	  try {
	    // relies on getSitelinkData validation
	    getSitelinkData(site);
	    return true
	  } catch (err) {
	    return false
	  }
	};

	const projectsBySuffix = {
	  i: 'wikipedia',
	  isource: 'wikisource',
	  iquote: 'wikiquote',
	  tionary: 'wiktionary',
	  ibooks: 'wikibooks',
	  iversity: 'wikiversity',
	  ivoyage: 'wikivoyage',
	  inews: 'wikinews'
	};

	var sitelinks = { getSitelinkUrl, getSitelinkData, isSitelinkKey };

	const { getSitelinkUrl: getSitelinkUrl$1 } = sitelinks;

	var simplify_sitelinks = (sitelinks, options = {}) => {
	  const { addUrl } = options;
	  return Object.keys(sitelinks).reduce(aggregateValues$1(sitelinks, addUrl), {})
	};

	const aggregateValues$1 = (sitelinks, addUrl) => (index, key) => {
	  const { title } = sitelinks[key];
	  if (addUrl) {
	    index[key] = { title, url: getSitelinkUrl$1(key, title) };
	  } else {
	    index[key] = title;
	  }
	  return index
	};

	var simplify_sparql_results = (input, options = {}) => {
	  if (typeof input === 'string') input = JSON.parse(input);

	  const { vars } = input.head;
	  const results = input.results.bindings;

	  if (vars.length === 1 && options.minimize === true) {
	    const varName = vars[0];
	    return results
	    .map(result => parseValue(result[varName]))
	    // filtering-out bnodes
	    .filter(result => result != null)
	  }

	  const { richVars, associatedVars, standaloneVars } = identifyVars(vars);
	  return results.map(getSimplifiedResult(richVars, associatedVars, standaloneVars))
	};

	const parseValue = valueObj => {
	  if (!(valueObj)) return
	  var { datatype } = valueObj;
	  datatype = datatype && datatype.replace('http://www.w3.org/2001/XMLSchema#', '');
	  const parser = parsers$1[valueObj.type] || getDatatypesParsers(datatype);
	  return parser(valueObj)
	};

	const parsers$1 = {
	  uri: valueObj => parseUri(valueObj.value),
	  // blank nodes will be filtered-out in order to get things simple
	  bnode: () => null
	};

	const numberParser = valueObj => parseFloat(valueObj.value);

	const getDatatypesParsers = datatype => {
	  datatype = datatype && datatype.replace('http://www.w3.org/2001/XMLSchema#', '');
	  return datatypesParsers[datatype] || passValue
	};

	const datatypesParsers = {
	  decimal: numberParser,
	  integer: numberParser,
	  float: numberParser,
	  double: numberParser,
	  boolean: valueObj => valueObj.value === 'true'
	};

	// return the raw value if the datatype is missing
	const passValue = valueObj => valueObj.value;

	const parseUri = uri => {
	  // ex: http://www.wikidata.org/entity/statement/
	  if (uri.match(/http.*\/entity\/statement\//)) {
	    return convertStatementUriToGuid(uri)
	  }

	  return uri
	  // ex: http://www.wikidata.org/entity/
	  .replace(/^https?:\/\/.*\/entity\//, '')
	  // ex: http://www.wikidata.org/prop/direct/
	  .replace(/^https?:\/\/.*\/prop\/direct\//, '')
	};

	const convertStatementUriToGuid = uri => {
	  // ex: http://www.wikidata.org/entity/statement/
	  uri = uri.replace(/^https?:\/\/.*\/entity\/statement\//, '');
	  const parts = uri.split('-');
	  return parts[0] + '$' + parts.slice(1).join('-')
	};

	const identifyVars = vars => {
	  const richVars = vars.filter(varName => vars.some(isAssociatedVar(varName)));
	  const associatedVarPattern = new RegExp(`^(${richVars.join('|')})[A-Z]`);
	  const associatedVars = vars.filter(varName => associatedVarPattern.test(varName));
	  const standaloneVars = vars.filter(varName => {
	    return !richVars.includes(varName) && !associatedVarPattern.test(varName)
	  });
	  return { richVars, associatedVars, standaloneVars }
	};

	const isAssociatedVar = varNameA => {
	  const pattern = new RegExp(`^${varNameA}[A-Z]\\w+`);
	  return pattern.test.bind(pattern)
	};

	const getSimplifiedResult = (richVars, associatedVars, standaloneVars) => result => {
	  const simplifiedResult = {};
	  for (const varName of richVars) {
	    const richVarData = {};
	    const value = parseValue(result[varName]);
	    if (value != null) richVarData.value = value;
	    for (const associatedVarName of associatedVars) {
	      if (associatedVarName.startsWith(varName)) addAssociatedValue(result, varName, associatedVarName, richVarData);
	    }
	    if (Object.keys(richVarData).length > 0) simplifiedResult[varName] = richVarData;
	  }
	  for (const varName of standaloneVars) {
	    simplifiedResult[varName] = parseValue(result[varName]);
	  }
	  return simplifiedResult
	};

	const addAssociatedValue = (result, varName, associatedVarName, richVarData) => {
	  // ex: propertyType => Type
	  var shortAssociatedVarName = associatedVarName.split(varName)[1];
	  // ex: Type => type
	  shortAssociatedVarName = shortAssociatedVarName[0].toLowerCase() + shortAssociatedVarName.slice(1);
	  // ex: altLabel => aliases
	  shortAssociatedVarName = specialNames[shortAssociatedVarName] || shortAssociatedVarName;
	  const associatedVarData = result[associatedVarName];
	  if (associatedVarData != null) richVarData[shortAssociatedVarName] = associatedVarData.value;
	};

	const specialNames = {
	  altLabel: 'aliases'
	};

	const { labels, descriptions, aliases, lemmas, glosses } = simplify_text_attributes;

	const {
	  simplifyClaim: claim,
	  simplifyPropertyClaims: propertyClaims,
	  simplifyClaims: claims,
	  simplifyQualifier: qualifier,
	  simplifyPropertyQualifiers: propertyQualifiers,
	  simplifyQualifiers: qualifiers
	} = simplify_claims;

	const { simplifyForm: form, simplifyForms: forms } = simplify_forms;
	const { simplifySense: sense, simplifySenses: senses } = simplify_senses;




	var simplify = {
	  labels,
	  descriptions,
	  aliases,
	  claim,
	  propertyClaims,
	  claims,
	  qualifier,
	  propertyQualifiers,
	  qualifiers,
	  sitelinks: simplify_sitelinks,

	  // Lexemes
	  lemmas,
	  glosses,
	  form,
	  forms,
	  sense,
	  senses,

	  sparqlResults: simplify_sparql_results

	  // Set in ./simplify_entity
	  // entity,
	  // entities,
	};

	const simplifyEntity = (entity, options) => {
	  const { type } = entity;
	  const simplified = {
	    id: entity.id,
	    type,
	    modified: entity.modified
	  };

	  if (entity.datatype) simplified.datatype = entity.datatype;

	  if (type === 'item') {
	    simplifyIfDefined(entity, simplified, 'labels');
	    simplifyIfDefined(entity, simplified, 'descriptions');
	    simplifyIfDefined(entity, simplified, 'aliases');
	    simplifyIfDefined(entity, simplified, 'claims', options);
	    simplifyIfDefined(entity, simplified, 'sitelinks', options);
	  } else if (type === 'property') {
	    simplified.datatype = entity.datatype;
	    simplifyIfDefined(entity, simplified, 'labels');
	    simplifyIfDefined(entity, simplified, 'descriptions');
	    simplifyIfDefined(entity, simplified, 'aliases');
	    simplifyIfDefined(entity, simplified, 'claims', options);
	  } else if (type === 'lexeme') {
	    simplifyIfDefined(entity, simplified, 'lemmas');
	    simplified.lexicalCategory = entity.lexicalCategory;
	    simplified.language = entity.language;
	    simplifyIfDefined(entity, simplified, 'claims', options);
	    simplifyIfDefined(entity, simplified, 'forms', options);
	    simplifyIfDefined(entity, simplified, 'senses', options);
	  }

	  return simplified
	};

	const simplifyIfDefined = (entity, simplified, attribute, options) => {
	  if (entity[attribute] != null) {
	    simplified[attribute] = simplify[attribute](entity[attribute], options);
	  }
	};

	const simplifyEntities = (entities, options = {}) => {
	  if (entities.entities) entities = entities.entities;
	  const { entityPrefix } = options;
	  return Object.keys(entities).reduce((obj, key) => {
	    const entity = entities[key];
	    if (entityPrefix) key = `${entityPrefix}:${key}`;
	    obj[key] = simplifyEntity(entity, options);
	    return obj
	  }, {})
	};

	// Set those here instead of in ./simplify to avoid a circular dependency
	simplify.entity = simplifyEntity;
	simplify.entities = simplifyEntities;

	var simplify_entity = { simplifyEntity, simplifyEntities };

	const { simplifyEntity: simplifyEntity$1 } = simplify_entity;

	var parse_responses = {
	  wd: {
	    entities: res => {
	      res = res.body || res;
	      const { entities } = res;
	      Object.keys(entities).forEach(entityId => {
	        entities[entityId] = simplifyEntity$1(entities[entityId]);
	      });
	      return entities
	    }
	  }
	};

	var querystring_lite = {
	  stringify: queryObj => {
	    var qstring = '';
	    for (const key in queryObj) {
	      const value = queryObj[key];
	      if (value) qstring += `&${key}=${value}`;
	    }

	    qstring = qstring.slice(1);

	    // encodeURI should be accessible in a browser environment
	    // otherwise if neither node.js querystring nor encodeURI
	    // are accessible, just return the string
	    if (encodeURI) return encodeURI(qstring)
	    return qstring
	  }
	};

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.


	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};
	function stringifyPrimitive(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	}

	function stringify (obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return map(objectKeys(obj), function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (isArray(obj[k])) {
	        return map(obj[k], function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	}
	function map (xs, f) {
	  if (xs.map) return xs.map(f);
	  var res = [];
	  for (var i = 0; i < xs.length; i++) {
	    res.push(f(xs[i], i));
	  }
	  return res;
	}

	var objectKeys = Object.keys || function (obj) {
	  var res = [];
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
	  }
	  return res;
	};

	function parse(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	}var require$$1 = {
	  encode: stringify,
	  stringify: stringify,
	  decode: parse,
	  parse: parse
	};

	const isBrowser = typeof location !== 'undefined' && typeof document !== 'undefined';
	const qs = isBrowser ? querystring_lite : require$$1;

	var build_url = instanceApiEndpoint => queryObj => {
	  // Request CORS headers if the request is made from a browser
	  // See https://www.wikidata.org/w/api.php ('origin' parameter)
	  if (isBrowser) queryObj.origin = '*';
	  return instanceApiEndpoint + '?' + qs.stringify(queryObj)
	};

	const { isPlainObject: isPlainObject$1 } = utils;
	const types = [ 'item', 'property', 'lexeme', 'form', 'sense' ];

	var search_entities = buildUrl => (search, language, limit, format, uselang) => {
	  // Using the variable 'offset' instead of 'continue' as the later is a reserved word
	  var type, offset;

	  // polymorphism: arguments can be passed as an object keys
	  if (isPlainObject$1(search)) {
	    // Not using destructuring assigment there as it messes with both babel and standard
	    const params = search;
	    search = params.search;
	    language = params.language;
	    limit = params.limit;
	    offset = params.continue;
	    format = params.format;
	    uselang = params.uselang;
	    type = params.type;
	  }

	  if (!(search && search.length > 0)) throw new Error("search can't be empty")

	  language = language || 'en';
	  uselang = uselang || language;
	  limit = limit || '20';
	  format = format || 'json';
	  type = type || 'item';
	  offset = offset || '0';

	  if (!types.includes(type)) throw new Error(`invalid type: ${type}`)

	  return buildUrl({
	    action: 'wbsearchentities',
	    search,
	    language,
	    limit,
	    continue: offset,
	    format,
	    uselang,
	    type
	  })
	};

	const validate = (name, testName) => value => {
	  if (!helpers_1[testName](value)) throw new Error(`invalid ${name}: ${value}`)
	};

	var validate_1 = {
	  entityId: validate('entity id', 'isEntityId'),
	  propertyId: validate('property id', 'isPropertyId'),
	  entityPageTitle: validate('entity page title', 'isEntityPageTitle'),
	  revisionId: validate('revision id', 'isRevisionId')
	};

	const { isPlainObject: isPlainObject$2, forceArray, shortLang } = utils;


	var get_entities = buildUrl => (ids, languages, props, format, redirects) => {
	  // Polymorphism: arguments can be passed as an object keys
	  if (isPlainObject$2(ids)) {
	    ({ ids, languages, props, format, redirects } = ids);
	  }

	  format = format || 'json';

	  // ids can't be let empty
	  if (!(ids && ids.length > 0)) throw new Error('no id provided')

	  // Allow to pass ids as a single string
	  ids = forceArray(ids);

	  ids.forEach(validate_1.entityId);

	  if (ids.length > 50) {
	    console.warn(`getEntities accepts 50 ids max to match Wikidata API limitations:
      this request won't get all the desired entities.
      You can use getManyEntities instead to generate several request urls
      to work around this limitation`);
	  }

	  // Properties can be either one property as a string
	  // or an array or properties;
	  // either case me just want to deal with arrays

	  const query = {
	    action: 'wbgetentities',
	    ids: ids.join('|'),
	    format
	  };

	  if (redirects === false) query.redirects = 'no';

	  if (languages) {
	    languages = forceArray(languages).map(shortLang);
	    query.languages = languages.join('|');
	  }

	  if (props && props.length > 0) query.props = forceArray(props).join('|');

	  return buildUrl(query)
	};

	const { isPlainObject: isPlainObject$3 } = utils;

	var get_many_entities = buildUrl => {
	  const getEntities = get_entities(buildUrl);
	  return (ids, languages, props, format, redirects) => {
	    // Polymorphism: arguments can be passed as an object keys
	    if (isPlainObject$3(ids)) {
	      ({ ids, languages, props, format, redirects } = ids);
	    }

	    if (!(ids instanceof Array)) throw new Error('getManyEntities expects an array of ids')

	    return getIdsGroups(ids)
	    .map(idsGroup => getEntities(idsGroup, languages, props, format, redirects))
	  }
	};

	const getIdsGroups = ids => {
	  const groups = [];
	  while (ids.length > 0) {
	    const group = ids.slice(0, 50);
	    ids = ids.slice(50);
	    groups.push(group);
	  }
	  return groups
	};

	const { forceArray: forceArray$1 } = utils;


	var get_revisions = buildUrl => (ids, options = {}) => {
	  ids = forceArray$1(ids);
	  ids.forEach(validate_1.entityPageTitle);

	  const uniqueId = ids.length === 1;
	  const query = {
	    action: 'query',
	    prop: 'revisions'
	  };

	  query.titles = ids.join('|');
	  query.format = options.format || 'json';
	  if (uniqueId) query.rvlimit = options.limit || 'max';
	  if (uniqueId && options.start) query.rvstart = getEpochSeconds(options.start);
	  if (uniqueId && options.end) query.rvend = getEpochSeconds(options.end);

	  const { prop, user, excludeuser, tag } = options;
	  if (prop) query.rvprop = forceArray$1(prop).join('|');
	  if (user) query.rvuser = user;
	  if (excludeuser) query.rvexcludeuser = excludeuser;
	  if (tag) query.rvtag = tag;

	  return buildUrl(query)
	};

	const getEpochSeconds = date => {
	  // Return already formatted epoch seconds:
	  // if a date in milliseconds appear to be earlier than 2000-01-01, that's probably
	  // already seconds actually
	  if (typeof date === 'number' && date < earliestPointInMs) return date
	  return Math.trunc(new Date(date).getTime() / 1000)
	};

	const earliestPointInMs = new Date('2000-01-01').getTime();

	const { isPlainObject: isPlainObject$4 } = utils;

	var get_entity_revision = instance => (id, revision) => {
	  if (isPlainObject$4(id)) {
	    revision = id.revision;
	    id = id.id;
	  }
	  validate_1.entityId(id);
	  validate_1.revisionId(revision);
	  return `${instance}/w/index.php?title=Special:EntityData/${id}.json&oldid=${revision}`
	};

	const { isPlainObject: isPlainObject$5, forceArray: forceArray$2, shortLang: shortLang$1 } = utils;

	var get_entities_from_sitelinks = buildUrl => (titles, sites, languages, props, format, redirects) => {
	  // polymorphism: arguments can be passed as an object keys
	  if (isPlainObject$5(titles)) {
	    // Not using destructuring assigment there as it messes with both babel and standard
	    const params = titles;
	    titles = params.titles;
	    sites = params.sites;
	    languages = params.languages;
	    props = params.props;
	    format = params.format;
	    redirects = params.redirects;
	  }

	  format = format || 'json';

	  // titles cant be let empty
	  if (!(titles && titles.length > 0)) throw new Error('no titles provided')
	  // default to the English Wikipedia
	  if (!(sites && sites.length > 0)) sites = [ 'enwiki' ];

	  // Properties can be either one property as a string
	  // or an array or properties;
	  // either case me just want to deal with arrays
	  titles = forceArray$2(titles);
	  sites = forceArray$2(sites).map(parseSite);
	  props = forceArray$2(props);

	  const query = {
	    action: 'wbgetentities',
	    titles: titles.join('|'),
	    sites: sites.join('|'),
	    format
	  };

	  // Normalizing only works if there is only one site and title
	  if (sites.length === 1 && titles.length === 1) {
	    query.normalize = true;
	  }

	  if (languages) {
	    languages = forceArray$2(languages).map(shortLang$1);
	    query.languages = languages.join('|');
	  }

	  if (props && props.length > 0) query.props = props.join('|');

	  if (redirects === false) query.redirects = 'no';

	  return buildUrl(query)
	};

	// convert 2 letters language code to Wikipedia sitelinks code
	const parseSite = site => site.length === 2 ? `${site}wiki` : site;

	const { fixedEncodeURIComponent: fixedEncodeURIComponent$1 } = utils;

	var sparql_query = sparqlEndpoint => sparql => {
	  const query = fixedEncodeURIComponent$1(sparql);
	  return `${sparqlEndpoint}?format=json&query=${query}`
	};

	const { forceArray: forceArray$3 } = utils;
	const { isItemId } = helpers_1;


	// Fiter-out properties. Can't be filtered by
	// `?subject a wikibase:Item`, as those triples are omitted
	// https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#WDQS_data_differences
	const itemsOnly = 'FILTER NOT EXISTS { ?subject rdf:type wikibase:Property . } ';

	var get_reverse_claims = sparqlEndpoint => {
	  const sparqlQuery = sparql_query(sparqlEndpoint);
	  return (property, value, options = {}) => {
	    var { limit, caseInsensitive, keepProperties } = options;
	    const valueFn = caseInsensitive ? caseInsensitiveValueQuery : directValueQuery;
	    const filter = keepProperties ? '' : itemsOnly;

	    // Allow to request values for several properties at once
	    var properties = forceArray$3(property);
	    properties.forEach(validate_1.propertyId);
	    properties = properties.map(prefixifyProperty).join('|');

	    const valueBlock = getValueBlock(value, valueFn, properties, filter);
	    var sparql = `SELECT DISTINCT ?subject WHERE { ${valueBlock} }`;
	    if (limit) sparql += ` LIMIT ${limit}`;
	    return sparqlQuery(sparql)
	  }
	};

	const getValueBlock = (value, valueFn, properties, filter) => {
	  if (!(value instanceof Array)) {
	    return valueFn(properties, getValueString(value), filter)
	  }

	  const valuesBlocks = value
	    .map(getValueString)
	    .map(valStr => valueFn(properties, valStr, filter));

	  return '{ ' + valuesBlocks.join('} UNION {') + ' }'
	};

	const getValueString = value => {
	  if (isItemId(value)) {
	    value = `wd:${value}`;
	  } else if (typeof value === 'string') {
	    value = `'${value}'`;
	  }
	  return value
	};

	const directValueQuery = (properties, value, filter, limit) => {
	  return `?subject ${properties} ${value} .
    ${filter}`
	};

	// Discussion on how to make this query optimal:
	// http://stackoverflow.com/q/43073266/3324977
	const caseInsensitiveValueQuery = (properties, value, filter, limit) => {
	  return `?subject ${properties} ?value .
    FILTER (lcase(?value) = ${value.toLowerCase()})
    ${filter}`
	};

	const prefixifyProperty = property => 'wdt:' + property;

	const { isPlainObject: isPlainObject$6 } = utils;






	const tip = `Tip: if you just want to access functions that don't need an instance or a sparqlEndpoint,
those are also exposed directly on the module object. Exemple:
const { isItemId, simplify } = require('wikibase-sdk')`;

	const common = Object.assign({ simplify, parse: parse_responses }, helpers_1, sitelinks, rank);

	const WBK = function (config) {
	  if (!isPlainObject$6(config)) throw new Error('invalid config')
	  const { instance, sparqlEndpoint } = config;

	  if (!(instance || sparqlEndpoint)) {
	    throw new Error(`one of instance or sparqlEndpoint should be set at initialization.\n${tip}`)
	  }

	  var wikibaseApiFunctions, instanceRoot, instanceApiEndpoint;
	  if (instance) {
	    validateEndpoint('instance', instance);

	    instanceRoot = instance
	      .replace(/\/$/, '')
	      .replace('/w/api.php', '');

	    instanceApiEndpoint = `${instanceRoot}/w/api.php`;

	    const buildUrl = build_url(instanceApiEndpoint);

	    wikibaseApiFunctions = {
	      searchEntities: search_entities(buildUrl),
	      getEntities: get_entities(buildUrl),
	      getManyEntities: get_many_entities(buildUrl),
	      getRevisions: get_revisions(buildUrl),
	      getEntityRevision: get_entity_revision(instance),
	      getEntitiesFromSitelinks: get_entities_from_sitelinks(buildUrl)
	    };
	  } else {
	    wikibaseApiFunctions = {
	      searchEntities: missingInstance('searchEntities'),
	      getEntities: missingInstance('getEntities'),
	      getManyEntities: missingInstance('getManyEntities'),
	      getRevisions: missingInstance('getRevisions'),
	      getEntityRevision: missingInstance('getEntityRevision'),
	      getEntitiesFromSitelinks: missingInstance('getEntitiesFromSitelinks')
	    };
	  }

	  var wikibaseQueryServiceFunctions;
	  if (sparqlEndpoint) {
	    validateEndpoint('sparqlEndpoint', sparqlEndpoint);
	    wikibaseQueryServiceFunctions = {
	      sparqlQuery: sparql_query(sparqlEndpoint),
	      getReverseClaims: get_reverse_claims(sparqlEndpoint)
	    };
	  } else {
	    wikibaseQueryServiceFunctions = {
	      sparqlQuery: missingSparqlEndpoint('sparqlQuery'),
	      getReverseClaims: missingSparqlEndpoint('getReverseClaims')
	    };
	  }

	  const parsedData = {
	    instance: {
	      root: instanceRoot,
	      apiEndpoint: instanceApiEndpoint
	    }
	  };

	  return Object.assign(parsedData, common, wikibaseApiFunctions, wikibaseQueryServiceFunctions)
	};

	// Make heplpers that don't require an instance to be specified available
	// directly on the exported function object
	Object.assign(WBK, common);

	const validateEndpoint = (name, url) => {
	  if (!(typeof url === 'string' && url.startsWith('http'))) {
	    throw new Error(`invalid ${name}: ${url}`)
	  }
	};

	const missingConfig = missingParameter => name => () => {
	  throw new Error(`${name} requires ${missingParameter} to be set at initialization`)
	};

	const missingSparqlEndpoint = missingConfig('a sparqlEndpoint');
	const missingInstance = missingConfig('an instance');

	var wikibaseSdk = WBK;

	// TODO: Expose API to allow user to set custom wikibase endpoint
	const wbk = wikibaseSdk({
	  instance: 'https://www.wikidata.org',
	  sparqlEndpoint: 'https://query.wikidata.org/sparql',
	});

	// Inject setimmediate polyfill in order to use dataloader in browser

	async function fetchEntitiesByIds({ids}) {
	  const url = wbk.getEntities({ids});
	  let response = await fetch(url);
	  let res = await response.json();
	  const {entities} = res;
	  const entityInstances = Object();
	  for (let [entityId, entity] of Object.entries(entities)) {
	    entityInstances[entityId] = entity;
	  }
	  return entityInstances
	}

	async function batchGetEntities(keys) {
	  const entities = await fetchEntitiesByIds({ids: keys});
	  return keys.map((key) => entities[key])
	}

	const entityLoader = new dataloader(batchGetEntities);

	async function fetchEntity({id}) {
	  return await entityLoader.load(id)
	}

	function parseArrayHTMLAttribute(value) {
	  const listOfValues = value.split(',');
	  return listOfValues.map((v) => v.trim())
	}

	class WikibaseEntity {
	  constructor(entity) {
	    // Original entitiy saved for future usage
	    this.entity = entity;
	    this.simplifyEntity = wbk.simplify.entity(entity);
	  }

	  static getEntity(args) {
	    return fetchEntity(args).then((entity) => new WikibaseEntity(entity))
	  }

	  formatUrl(value) {
	    const templates = this.simplifyEntity.claims.P1630;
	    if (templates.length === 0) {
	      throw new Error(
	        `The property ${this.simplifyEntity.id} do not have a format url property (P1630)`
	      )
	    }
	    const formatUrlTemplate = templates[0];
	    // TODO: double check if that's possbile to more than 1 placeholder in the formatter?
	    return formatUrlTemplate.replace('$1', value)
	  }

	  getLabel(lang) {
	    return Promise.resolve(this.simplifyEntity.labels[lang])
	  }

	  getDescription(lang) {
	    return Promise.resolve(this.simplifyEntity.descriptions[lang])
	  }

	  getProperty(property, lang) {
	    const propertyValue = this.simplifyEntity.claims[property];

	    if (wbk.isItemId(propertyValue)) {
	      if (!lang) {
	        throw new Error(
	          'You need to have provide a lang argument to display the property'
	        )
	      }

	      return this.constructor
	        .getEntity({id: propertyValue})
	        .then((item) => item.getLabel(lang))
	    } else {
	      return Promise.resolve(propertyValue)
	    }
	  }

	  getPropertyLink(property) {
	    const propertyItemList = wbk.simplify.propertyClaims(
	      this.entity.claims[property],
	      {
	        keepTypes: true,
	      }
	    );

	    if (propertyItemList.length >= 0) {
	      const propertyItem = propertyItemList[0];
	      const {type, value} = propertyItem;

	      if (type === 'url') {
	        return Promise.resolve(value)
	      } else if (type === 'external-id') {
	        // TODO add options to fetch less data because we only to format the external id
	        return this.constructor
	          .getEntity({id: property})
	          .then((item) => item.formatUrl(value))
	      } else {
	        throw new Error('This property is not a valid url or external id')
	      }
	    }

	    // return Promise.resolve(propertyValue)
	  }

	  getSiteLink(sitenames) {
	    const sitelinks = this.entity.sitelinks;

	    for (var sitename of sitenames) {
	      const sitelink = sitelinks[sitename];
	      if (sitelink) {
	        return Promise.resolve({
	          ...sitelink,
	          link: wbk.getSitelinkUrl(sitelink),
	        })
	      }
	    }

	    return Promise.reject()
	  }
	}

	class WDEntityElement extends HTMLElement {
	  constructor() {
	    super();
	  }

	  connectedCallback() {
	    // TODO: deprecate the use of "id", since that's a built-in attribute in html
	    const entityId = this.getAttribute('entity-id') || this.getAttribute('id');
	    this.renderItem(entityId);
	  }

	  renderItem(entityId) {
	    const property = this.getAttribute('property');
	    const description = this.hasAttribute('description');
	    const lang = this.getAttribute('lang');

	    WikibaseEntity.getEntity({id: entityId}).then((entity) => {
	      let q = null;

	      if (description) {
	        q = entity.getDescription(lang);
	      } else if (property) {
	        q = entity.getProperty(property, lang);
	      } else {
	        q = entity.getLabel(lang);
	      }
	      return q.then((value) => {
	        this.textContent = value;
	      })
	    });
	  }

	  disconnectedCallback() {}
	}

	if (!window.customElements.get('wd-entity')) {
	  window.WDEntityElement = WDEntityElement;
	  window.customElements.define('wd-entity', WDEntityElement);
	}

	class WDLinkElement extends HTMLAnchorElement {
	  constructor() {
	    super();
	  }

	  static get observedAttributes() {
	    return ['entity-id', 'site', 'property']
	  }

	  connectedCallback() {
	    const entityId = this.getAttribute('entity-id');
	    this.renderElement(entityId);
	  }

	  attributeChangedCallback(_, oldValue, newValue) {
	    if (oldValue !== newValue) {
	      this.renderElement(this.getAttribute('entity-id'));
	    }
	  }

	  renderElement(entityId) {
	    const property = this.getAttribute('property');
	    const site = this.getAttribute('site');

	    if (!(property || site)) {
	      throw new Error("You need either 'property' or 'site' in the attributes")
	    }

	    WikibaseEntity.getEntity({id: entityId}).then((entity) => {
	      if (property) {
	        entity.getPropertyLink(property).then((value) => {
	          this.setAttribute('href', value);
	        });
	      } else {
	        entity.getSiteLink(parseArrayHTMLAttribute(site)).then(({link}) => {
	          this.setAttribute('href', link);
	        });
	      }
	    });
	  }
	}

	if (!window.customElements.get('wd-link')) {
	  window.WDLinkElement = WDLinkElement;
	  window.customElements.define('wd-link', WDLinkElement, {extends: 'a'});
	}

	exports.WDEntityElement = WDEntityElement;
	exports.WDLinkElement = WDLinkElement;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
