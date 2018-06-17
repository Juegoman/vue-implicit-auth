// local storage keys
import LSKEYS from './LSKEYS'

/**
 * Azure Active Directory AuthDriver
 * implements AuthDriver interface
 * @param opts options object requires:
 *  - TENANT AAD tenant
 *  - CLIENT_ID AAD application id
 *  - REDIRECT_URI uri to redirect to after a login/logout request
 * @constructor
 */
function AADDriver (opts) {
  this.id_token = null
  this.authContext = null
  // required options
  if (!opts.TENANT) {
    throw new Error('TENANT is required in AADDriver')
  }
  this.TENANT = opts.TENANT
  if (!opts.CLIENT_ID) {
    throw new Error('CLIENT_ID is required in AADDriver')
  }
  this.CLIENT_ID = opts.CLIENT_ID
  if (!opts.REDIRECT_URI) {
    throw new Error('REDIRECT_URI is required in AADDriver')
  }
  this.REDIRECT_URI = opts.REDIRECT_URI
  Object.defineProperties(this, {
    idToken: {
      get: () => this.id_token,
      set: token => {
        // nonce check
        let decoded = decode(token.split('.')[1])
        if (decoded.nonce !== this.nonce) {
          throw new Error('Token nonce does not match stored nonce')
        }
        // logged in
        window.localStorage.setItem(LSKEYS.ID_TOKEN, token)
        this.id_token = token
        // if reactiveChange is defined in authContext then update the reactive interface
        if (this.authContext.reactiveChange) {
          this.authContext.reactiveChange('idToken', token)
          this.authContext.reactiveChange('decodedToken', this.decodedToken)
        }
      }
    },
    decodedToken: {
      get: () => {
        let splitToken = this.idToken.split('.')
        return {
          header: decode(splitToken[0]),
          payload: decode(splitToken[1])
        }
      }
    },
    nonce: {
      get: () => window.localStorage.getItem(LSKEYS.NONCE),
      set: nonce => window.localStorage.setItem(LSKEYS.NONCE, nonce)
    }
  })
}

/**
 * handles returning redirect by decoding the hash that AAD returns
 * also handles loading id_token stored in localStorage
 * then initializes http instance
 * @param authContext Authentication handler object
 */
AADDriver.prototype.init = function (authContext) {
  // set the authContext
  this.authContext = authContext
  // is the application coming from a redirect?
  let returned = readHash(window.location.hash)
  if (returned) {
    // silent login error, try logging in again with silent off
    if (returned.error_description && returned.error_description.includes('AADSTS50058')) {
      this.login(false)
    }
    // hash contains the id_token
    if (returned.id_token) {
      this.idToken = returned.id_token
    }
  } else {
    // not coming from redirect, so check if id token is stored in localStorage
    let idToken = window.localStorage.getItem(LSKEYS.ID_TOKEN)
    if (idToken) {
      // id token was stored, so we are logged in
      this.idToken = idToken
    }
  }
  authContext.configureHttp()
}
/**
 * Checks the nonce on an id_token with the saved nonce,
 * then saves id_token on success
 * @param token
 */

AADDriver.prototype.login = function (silent) {
  // redirect to login
  window.location.replace(this.makeLoginUri(silent))
}
/**
 * Clear localStorage and redirect to microsoft logout endpoint
 */
AADDriver.prototype.logout = function () {
  window.localStorage.removeItem(LSKEYS.ID_TOKEN)
  window.localStorage.removeItem(LSKEYS.NONCE)
  window.localStorage.removeItem(LSKEYS.AUTH_STYLE)
  window.location.replace(`https://login.microsoftonline.com/${this.TENANT}/oauth2/logout?post_logout_redirect_uri=${this.REDIRECT_URI}`)
}
/**
 * generates and saves a nonce to be compared on successful redirect, then returns a uri to login to AAD
 * @param silent whether to add a no prompt option to the uri
 * @return {string} uri to request id token from AAD
 */
AADDriver.prototype.makeLoginUri = function (silent) {
  // generate and save a nonce to localStorage
  let nonce = generateNonce()
  this.nonce = nonce
  // generate the base uri
  let uri = `https://login.microsoftonline.com/${this.TENANT}/oauth2/authorize` +
    `?client_id=${this.CLIENT_ID}` +
    '&response_type=id_token' +
    `&redirect_uri=${this.REDIRECT_URI}` +
    `&nonce=${nonce}`
  // if silent then uri will not prompt, but will error if not logged in
  if (silent) {
    uri += '&prompt=none'
  }
  return uri
}
/**
 * uses an iframe to send a silent login request to AAD for a new id_token
 * @return {Promise}
 */
AADDriver.prototype.backgroundLogin = async function () {
  // create iframe
  const frame = document.createElement('iframe')
  frame.setAttribute('id', 'auth-frame')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.visibility = 'hidden'
  frame.style.position = 'absolute'
  frame.style.width = frame.style.height = frame.borderWidth = '0px'
  const attachedFrame = document.getElementsByTagName('body')[0].appendChild(frame)
  let resetEvent = await runIframeNavigation(attachedFrame, 'about:blank')
  let authEvent = await runIframeNavigation(resetEvent.target, this.makeLoginUri(true))
  // process the response from the url hash
  let response = readHash(authEvent.target.contentWindow.location.hash)
  if (!response || response.error_description) {
    // if there's an issue when renewing the token, force a full login
    this.login()
  }
  if (response.id_token) {
    this.idToken = response.id_token
  }
  // remove iframe
  attachedFrame.remove()
  return response.id_token
}

function runIframeNavigation (iframe, url) {
  return new Promise(resolve => {
    iframe.onload = loadEvent => resolve(loadEvent)
    iframe.setAttribute('src', url)
  })
}

/**
 * Converts a hash response to an object
 * @param hash
 * @return hash object or false
 */
function readHash (hash) {
  let hsh = hash.slice(1)
  if (hsh) {
    let list = hsh.split('&')
    let obj = {}
    for (let kv of list) {
      let [key, val] = kv.split('=')
      obj[key] = decodeURIComponent(val)
    }
    return obj
  }
  return false
}

/**
 * Decodes a url safe base64 string to object
 * @param b64
 * @return {any}
 */
function decode (b64) {
  try {
    return JSON.parse(window.atob(b64.replace(/-/g, '+').replace(/_/g, '/')))
  } catch (e) {
    if (e.name === 'SyntaxError') {
      return { error: 'Malformed token' }
    } else {
      throw e
    }
  }
}
// str byteToHex(uint8 byte)
//   converts a single byte to a hex string
function byteToHex (byte) {
  return ('0' + byte.toString(16)).slice(-2)
}
function generateNonce () {
  let arr = new Uint8Array(20)
  window.crypto.getRandomValues(arr)
  return [].map.call(arr, byteToHex).join('')
}

export { AADDriver, AADDriver as default }
