import axios from 'axios'
// local storage keys
import LSKEYS from './LSKEYS'
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
function Authentication (params) {
  if (params.authStyles === undefined) {
    throw new Error('authStyles are required for Authentication')
  }
  if (params.baseURL === undefined) {
    throw new Error('baseURL is required for Authentication')
  }
  this.authStyles = params.authStyles
  this.baseURL = params.baseURL
  if (params.reactiveChange) {
    this.reactiveChange = params.reactiveChange
  }
  this.http = null
  Object.defineProperties(this, {
    // returns all currently registered authStyles
    styles: {
      get: () => Object.keys(this.authStyles)
    },
    // returns or sets the currently selected authStyle
    currentAuthStyle: {
      get: () => {
        return window.localStorage.getItem(LSKEYS.AUTH_STYLE)
      },
      set: (value) => {
        window.localStorage.setItem(LSKEYS.AUTH_STYLE, value)
        if (this.reactiveChange) this.reactiveChange('currentAuthStyle', value)
      }
    },
    // returns the currently selected AuthDriver or null
    currentAuthDriver: {
      get: () => {
        if (this.currentAuthStyle !== null && this.authStyles.hasOwnProperty(this.currentAuthStyle)) {
          return this.authStyles[this.currentAuthStyle]
        }
        return null
      }
    },
    // returns the currently active id token or null
    idToken: {
      get: () => {
        if (this.currentAuthDriver) {
          return this.currentAuthDriver.idToken
        }
        return null
      }
    },
    // returns a decoded token as an object or null
    decodedToken: {
      get: () => {
        if (this.currentAuthDriver) {
          return this.currentAuthDriver.decodedToken
        }
        return null
      }
    }
  })
  // update the reactive interface with the currentAuthStyle
  if (this.reactiveChange) {
    this.reactiveChange('currentAuthStyle', this.currentAuthStyle)
  }
  // if an authStyle is already set in localStorage, init the relevant AuthDriver
  if (this.currentAuthDriver) {
    this.currentAuthDriver.init(this)
  }
}
// creates an axios instance which is configured to automatically send an authorization header to a specified base url
// the instance is configured to retry unauthenticated requests
Authentication.prototype.configureHttp = function () {
  let httpInstance = axios.create({
    baseURL: this.baseURL,
    headers: {
      Authorization: 'Bearer ' + this.idToken
    }
  })
  httpInstance.interceptors.response.use(response => response, async (error) => {
    if (error.response.status !== 401) {
      throw error
    } else {
      // get token from current AuthDriver token refresh
      const token = await this.currentAuthDriver.backgroundLogin()
      // set the default Authorization header with the new token
      httpInstance.defaults.headers['Authorization'] = 'Bearer ' + token
      // retry the unauthenticated request
      let config = error.response.config
      config.headers.Authorization = 'Bearer ' + token
      try {
        return await httpInstance({
          method: config.method,
          url: config.url,
          data: config.data,
          headers: {
            'Accept': config.headers['Accept'],
            'Authorization': config.headers['Authorization'],
            'Content-Type': config.headers['Content-Type']
          }
        })
      } catch (retryError) {
        throw retryError
      }
    }
  })
  this.http = httpInstance
}
/**
 * wrapper for AuthDriver login() method,
 * AuthDriver selection happens at this point
 * @param style authStyle to use
 */
Authentication.prototype.login = function (style) {
  this.currentAuthStyle = style
  if (this.currentAuthDriver) {
    this.currentAuthDriver.login()
  }
}
/**
 * wrapper for AuthDriver logout() method
 */
Authentication.prototype.logout = function () {
  if (this.currentAuthDriver) {
    this.currentAuthDriver.logout()
  }
}
export { Authentication, Authentication as default }
