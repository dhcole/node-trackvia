var request = require('request');

var API_URL = 'https://api.trackvia.com/';

/**
 *  TrackVia(options) -> Trackvia
 *    - options (Object): Object containing authentication credentials
 *      - client_id (String)
 *      - client_secret (String)
 *      - username (String)
 *      - password (String)
 *
 *  Initializes the TrackVia API client. Takes authentication config and returns itself
 **/
var TrackVia = function(options) {
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
    config = this.config;

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
        if (!res.body.length && !err) err = 'Error: empty response. Status code: ' + res.statusCode;
        if (callback) callback(err, JSON.parse(res.body || null));
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
   *    - callback (Function): Called after request completes (error, response)
   *
   *  Tables endpoint: http://www.trackvia.com/overview/trackvia-api/#table
   *  TODO: foreign_keys
   **/
   this.tables = function(id, callback) {
     if (!callback && typeof id === 'function') {
       throw new Error('`tables` endpoint requires an `id`');
     }
     var options = {
       endpoint: 'tables/' + id
     };
     this.request(options, callback);
   };

  return this;
};

module.exports = TrackVia;
