'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AuthPlugin = undefined;

var _Authentication = require('./Authentication');

var _Authentication2 = _interopRequireDefault(_Authentication);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AuthPlugin = {
  /**
   * Required opts:
   *  - authStyles object: contains AuthDriver instances
   *  - baseURL string: url to base http requests on
   */
  install: function install(Vue, opts) {
    // reactive interface
    var authInterface = new Vue({
      data: {
        idToken: null,
        decodedToken: null,
        currentAuthStyle: null
      }
    });
    // changes a data property on the vue store, will be reactive
    opts.reactiveChange = function (property, value) {
      authInterface.$data[property] = value;
    };
    // initialize Authentication manager
    Vue.Authentication = new _Authentication2.default(opts);
    // attach http object to vue prototype
    Vue.prototype.$http = Vue.Authentication.http;
    // attach auth interface to vue prototype
    Vue.prototype.$auth = {
      login: function login(style) {
        Vue.Authentication.login(style);
      },
      logout: function logout() {
        Vue.Authentication.logout();
      },

      get styles() {
        return Vue.Authentication.styles;
      },
      get currentAuthDriver() {
        return Vue.Authentication.currentAuthDriver;
      },
      get currentAuthStyle() {
        return authInterface.$data.currentAuthStyle;
      },
      get idToken() {
        return authInterface.$data.idToken;
      },
      get decodedToken() {
        return authInterface.$data.decodedToken;
      }
    };
  }
}; /**
    * Vue plugin for Authentication
    */
exports.AuthPlugin = AuthPlugin;
exports.default = AuthPlugin;