
/**
 * Module dependencies.
 */

var proto = require('./lib/proto')
  , statics = require('./lib/static')
  , Emitter = require('tower-emitter');

/**
 * Expose `model`.
 */

exports = module.exports = model;

/**
 * Create a new model constructor with the given `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function model(name) {
  if (constructors[name]) return constructors[name];

  /**
   * Initialize a new model with the given `attrs`.
   *
   * @param {Object} attrs
   * @api public
   */

  function Model(attrs) {
    attrs || (attrs = {});

    this.attrs = attrs;
    this.dirty = attrs;
    this._callbacks = {};
    Model.emit('init', this);
    // XXX: need function binding component
    // https://github.com/component/bind/blob/master/index.js
    // but that is inefficient.
    // this.action = this.action.bind(this);
  }

  Model.toString = function toString(){
    return 'model("' + name + '")';
  }

  // statics

  Model.className = name;
  Model.attrs = [];
  Model.validators = [];
  Model.prototypes = [];
  Model.relations = [];
  Model._callbacks = {};

  for (var key in statics) Model[key] = statics[key];

  // prototype

  Model.prototype = {};
  Model.prototype.constructor = Model;
  
  for (var key in proto) Model.prototype[key] = proto[key];

  constructors[name] = Model;
  constructors.push(Model);
  exports.emit('define ' + name, Model);
  exports.emit('define', Model);

  return Model;
}

/**
 * Model classes.
 */

var constructors = exports.constructors = [];

/**
 * Mixins.
 */

exports.use = function(obj){
  if ('function' === typeof obj) {
    obj.call(exports, statics, proto, exports);
  } else {
    for (var key in obj) statics[key] = obj[key]
  }
}

/**
 * Lazy-load stuff for a particular constructor.
 *
 * Example:
 *
 *    model.load('user', require.resolve('./lib/user'));
 *
 * @param {String} name
 * @param {String} path
 */

exports.load = function(name, path){
  exports.on('define ' + name, function(){
    require(path);
  });

  return exports;
}

/**
 * Mixin `Emitter`.
 */

Emitter(model);
Emitter(statics);
Emitter(proto);

/**
 * Clear models.
 */

exports.clear = function(){
  constructors.forEach(function(emitter){
    emitter.off('define');
    delete constructors[emitter.className];
  });

  constructors.length = 0;

  return exports;
}