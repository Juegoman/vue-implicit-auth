/**
 * Vue plugin for Authentication
 */
import Authentication from './Authentication'

const AuthPlugin = {
  /**
   * Required opts:
   *  - authStyles object: contains AuthDriver instances
   *  - baseURL string: url to base http requests on
   */
  install (Vue, opts) {
    // reactive interface
    let authInterface = new Vue({
      data: {
        idToken: null,
        decodedToken: null,
        currentAuthStyle: null
      }
    })
    // changes a data property on the vue store, will be reactive
    opts.reactiveChange = (property, value) => {
      authInterface.$data[property] = value
    }
    // initialize Authentication manager
    Vue.Authentication = new Authentication(opts)
    // attach http object to vue prototype
    Vue.prototype.$http = Vue.Authentication.http
    // attach auth interface to vue prototype
    Vue.prototype.$auth = {
      login (style) { Vue.Authentication.login(style) },
      logout () { Vue.Authentication.logout() },
      get styles () { return Vue.Authentication.styles },
      get currentAuthDriver () { return Vue.Authentication.currentAuthDriver },
      get currentAuthStyle () { return authInterface.$data.currentAuthStyle },
      get idToken () { return authInterface.$data.idToken },
      get decodedToken () { return authInterface.$data.decodedToken }
    }
  }
}

export { AuthPlugin, AuthPlugin as default }
