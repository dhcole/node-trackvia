var request = require('request');

var API_URL = 'https://api.trackvia.com/';

/**
 *  trackvia(options) -> trackvia
 *    - options (Object): Object containing authentication credentials
 *      - client_id (String)
 *      - client_secret (String)
 *      - username (String)
 *      - password (String)
 *
 *  Initializes the TrackVia API client. Takes authentication config and returns itself
 *  TODO: Format methods (json [default], csv, xls, etc)
 *  TODO: "date only" date objects: http://www.trackvia.com/overview/trackvia-api/#errata
 **/
var trackvia = function(options) {
  var instance = this;
  this.config = options;

  /**
   *  #authenticate(callback) -> null
   *    - callback (Function): Runs with arguments error, and response data
   *
   *  Authenticates into the API and saves access_token: http://www.trackvia.com/overview/trackvia-api/#authentication
   *  TODO: refresh_token
   **/
  this.authenticate = function(callback) {
    var config = this.config;

    var auth_url = API_URL + 'oauth/v2/token' +
      '?client_id=' + config.client_id +
      '&client_secret=' + config.client_secret +
      '&grant_type=password' +
      '&username=' + config.username +
      '&password=' + config.password;

    request.get(auth_url, function(err, res) {
      res = JSON.parse(res.body);
      instance.access_token = res.access_token;
      if (callback) callback(err, res);
    });
  };

  /**
   *  #request(options, callback) -> null
   *    - options (Object): `request` options. See: https://github.com/mikeal/request
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Request handler. Checks for access_token or authenticates
   **/
  this.request = function(options, callback) {
    var instance = this;
    var retry = true;

    if (!this.access_token) {
      this.authenticate(req.bind(this, options, callback));
    } else {
      req(options, callback);
    }

    function req(options, callback) {
      options.url = API_URL + options.endpoint;
      options.qs = options.qs || {};
      options.qs.access_token = instance.access_token;
      request(options, function(err, res) {
        var status = res.statusCode;
        res = JSON.parse(res.body || null);

        // Handle errors
        if (!err && !res) err = 'Error: empty response. Status code: ' + status;
        if (res && res.error) {
          err = res;
          res = undefined;
        }

        // Reauthorize request
        if (err && err.error === 'invalid_grant' && retry) {
          retry = false;
          instance.authenticate(req.bind(instance, options, callback));
          return;
        }

        if (callback) callback(err, res);
      });
    }
  };

  /**
   *  #dashboards([id], callback) -> null
   *    - id (String): Optional id of dashboard to load. If omitted, lists all dashboards.
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Dashboards endpoint: http://www.trackvia.com/overview/trackvia-api/#dashboards
   **/
  this.dashboards = function(id, callback) {
    if (!callback && typeof id === 'function') {
      callback = id;
      id = undefined;
    }

    var options = {
      endpoint: (id) ? 'dashboards/' + id : 'dashboards'
    };

    this.request(options, callback);
  };

  /**
   *  #apps([id], callback) -> null
   *    - id (String): Optional id of app to load. If omitted, lists all apps.
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Apps endpoint: http://www.trackvia.com/overview/trackvia-api/#apps
   **/
  this.apps = function(id, callback) {
    if (!callback && typeof id === 'function') {
      callback = id;
      id = undefined;
    }

    var options = {
      endpoint: (id) ? 'apps/' + id : 'apps'
    };

    this.request(options, callback);
  };

  /**
   *  #tables(id, callback) -> null
   *    - id (String): id of table to load.
   *    - foreign_key_id (String): Optional foreign_key_id to get associated values
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Tables endpoint: http://www.trackvia.com/overview/trackvia-api/#table
   **/
  this.tables = function(id, foreign_key_id, callback) {
    if (!id || (typeof id !== 'string' && typeof id !== 'number'))
      throw new Error('`tables` endpoint requires an `id`');
    if (!callback && typeof foreign_key_id === 'function') {
      callback = foreign_key_id;
      foreign_key_id = undefined;
    }

    var options = {
      endpoint: (!foreign_key_id) ?
        'tables/' + id :
        'tables/' + id + '/foreign_keys/' + foreign_key_id
    };

    this.request(options, callback);
  };

  /**
   *  #views(id, callback) -> null
   *    - id (String): id of view to load.
   *    - parameters (Object): Optional parameters object for pagination
   *      - page (Integer): Page of results
   *      - limit (Integer): Limit amount of records returned
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Views endpoint: http://www.trackvia.com/overview/trackvia-api/#viewlistofrecords
   **/
  this.views = function(id, params, callback) {
    if (!id || (typeof id !== 'string' && typeof id !== 'number'))
      throw new Error('`views` endpoint requires an `id`');
    if (!callback && typeof params === 'function') {
      callback = params;
      params = undefined;
    }

    var options = {
      endpoint: 'views/' + id,
    };
    if (params) options.qs = {};
    if (params && params.page) options.qs.page = params.page;
    if (params && params.limit) options.qs.limit = params.limit;

    this.request(options, callback);
  };

  /**
   *  #records(id, callback) -> null
   *    - id (String): id of record to load.
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Records endpoint: http://www.trackvia.com/overview/trackvia-api/#records
   *  TODO: insert, update, delete methods
   **/
  this.records = function(id, callback) {
    if (!id || (typeof id !== 'string' && typeof id !== 'number'))
      throw new Error('`records` endpoint requires an `id`');

    var options = {
      endpoint: 'records/' + id
    };

    this.request(options, callback);
  };

  /**
   *  #forms(id, callback) -> null
   *    - id (String): id of table to load.
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Forms endpoint: http://www.trackvia.com/overview/trackvia-api/#forms
   **/
  this.forms = function(id, callback) {
    if (!id || (typeof id !== 'string' && typeof id !== 'number'))
      throw new Error('`forms` endpoint requires an `id`');

    var options = {
      endpoint: 'tables/' + id + '/forms'
    };

    this.request(options, callback);
  };

  /**
   *  #search(id, callback) -> null
   *    - id (String): id of table to load.
   *    - search_term (String): search term
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Search endpoint: http://www.trackvia.com/overview/trackvia-api/#search
   **/
  this.search = function(id, term, callback) {
    if (!id || (typeof id !== 'string' && typeof id !== 'number'))
      throw new Error('`search` endpoint requires an `id`');
    if (!term || typeof term !== 'string')
      throw new Error('`search` endpoint requires a `search_term`');

    var options = {
      endpoint: 'search/' + id + '/' + encodeURIComponent(term)
    };

    this.request(options, callback);
  };

  return this;
};

module.exports = trackvia;
