'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Authentication = undefined;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _LSKEYS = require('./LSKEYS');

var _LSKEYS2 = _interopRequireDefault(_LSKEYS);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
// local storage keys


/**
 * AuthDriver interface
 * idToken (getter/setter)
 * decodedToken (getter)
 * init(Authentication) handle returning from redirect
 * login()
 * backgroundLogin()
 * logout()
 */

/**
 * Authentication handler object
 * @param params   configuration object requires:
 *  - authStyles Object containing AuthDriver type objects
 *  - baseURL String url to base all http requests to
 *  ? reactiveChange optional Function to notify an external datastore of a changed value
 * @constructor
 */
function Authentication(params) {
  var _this = this;

  if (params.authStyles === undefined) {
    throw new Error('authStyles are required for Authentication');
  }
  if (params.baseURL === undefined) {
    throw new Error('baseURL is required for Authentication');
  }
  this.authStyles = params.authStyles;
  this.baseURL = params.baseURL;
  if (params.reactiveChange) {
    this.reactiveChange = params.reactiveChange;
  }
  this.http = null;
  Object.defineProperties(this, {
    // returns all currently registered authStyles
    styles: {
      get: function get() {
        return Object.keys(_this.authStyles);
      }
    },
    // returns or sets the currently selected authStyle
    currentAuthStyle: {
      get: function get() {
        return window.localStorage.getItem(_LSKEYS2.default.AUTH_STYLE);
      },
      set: function set(value) {
        window.localStorage.setItem(_LSKEYS2.default.AUTH_STYLE, value);
        if (_this.reactiveChange) _this.reactiveChange('currentAuthStyle', value);
      }
    },
    // returns the currently selected AuthDriver or null
    currentAuthDriver: {
      get: function get() {
        if (_this.currentAuthStyle !== null && _this.authStyles.hasOwnProperty(_this.currentAuthStyle)) {
          return _this.authStyles[_this.currentAuthStyle];
        }
        return null;
      }
    },
    // returns the currently active id token or null
    idToken: {
      get: function get() {
        if (_this.currentAuthDriver) {
          return _this.currentAuthDriver.idToken;
        }
        return null;
      }
    },
    // returns a decoded token as an object or null
    decodedToken: {
      get: function get() {
        if (_this.currentAuthDriver) {
          return _this.currentAuthDriver.decodedToken;
        }
        return null;
      }
    }
  });
  // update the reactive interface with the currentAuthStyle
  if (this.reactiveChange) {
    this.reactiveChange('currentAuthStyle', this.currentAuthStyle);
  }
  // if an authStyle is already set in localStorage, init the relevant AuthDriver
  if (this.currentAuthDriver) {
    this.currentAuthDriver.init(this);
  }
}
// creates an axios instance which is configured to automatically send an authorization header to a specified base url
// the instance is configured to retry unauthenticated requests
Authentication.prototype.configureHttp = function () {
  var _this2 = this;

  var httpInstance = _axios2.default.create({
    baseURL: this.baseURL,
    headers: {
      Authorization: 'Bearer ' + this.idToken
    }
  });
  httpInstance.interceptors.response.use(function (response) {
    return response;
  }, function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(error) {
      var token, config;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(error.response.status !== 401)) {
                _context.next = 4;
                break;
              }

              throw error;

            case 4:
              _context.next = 6;
              return _this2.currentAuthDriver.backgroundLogin();

            case 6:
              token = _context.sent;

              // set the default Authorization header with the new token
              httpInstance.defaults.headers['Authorization'] = 'Bearer ' + token;
              // retry the unauthenticated request
              config = error.response.config;

              config.headers.Authorization = 'Bearer ' + token;
              _context.prev = 10;
              _context.next = 13;
              return httpInstance({
                method: config.method,
                url: config.url,
                data: config.data,
                headers: {
                  'Accept': config.headers['Accept'],
                  'Authorization': config.headers['Authorization'],
                  'Content-Type': config.headers['Content-Type']
                }
              });

            case 13:
              return _context.abrupt('return', _context.sent);

            case 16:
              _context.prev = 16;
              _context.t0 = _context['catch'](10);
              throw _context.t0;

            case 19:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this2, [[10, 16]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
  this.http = httpInstance;
};
/**
 * wrapper for AuthDriver login() method,
 * AuthDriver selection happens at this point
 * @param style authStyle to use
 */
Authentication.prototype.login = function (style) {
  this.currentAuthStyle = style;
  if (this.currentAuthDriver) {
    this.currentAuthDriver.login();
  }
};
/**
 * wrapper for AuthDriver logout() method
 */
Authentication.prototype.logout = function () {
  if (this.currentAuthDriver) {
    this.currentAuthDriver.logout();
  }
};
exports.Authentication = Authentication;
exports.default = Authentication;