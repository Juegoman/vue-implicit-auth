import Authentication from '../src/Authentication'
import LSKEYS from '../src/LSKEYS'
import { LocalStorageMock, testDriver } from './testutil'

global.localStorage = new LocalStorageMock()

beforeEach(() => {
  localStorage.clear()
})
describe('Authentication.js', () => {
  it('requires authStyle in params', () => {
    let tryAction = () => {
      /* eslint-disable no-new */
      new Authentication({ baseURL: '' })
    }
    expect(tryAction).toThrow('authStyles are required for Authentication')
  })
  it('requires baseURL in params', () => {
    let tryAction = () => {
      /* eslint-disable no-new */
      new Authentication({ authStyles: {} })
    }
    expect(tryAction).toThrow('baseURL is required for Authentication')
  })
  it('sets reactiveChange if in params', () => {
    let params = {
      authStyles: {},
      baseURL: '',
      reactiveChange: jest.fn()
    }
    let auth = new Authentication(params)
    expect(auth.reactiveChange).toBe(params.reactiveChange)
  })
  describe('currentAuthStyle not set', () => {
    let auth
    beforeEach(() => {
      auth = new Authentication({
        authStyles: {
          'TEST': testDriver,
          'test2': {},
          'testStyle': {}
        },
        baseURL: 'test'
      })
    })
    it('returns list of registered authStyles', () => {
      expect(auth.styles).toEqual(['TEST', 'test2', 'testStyle'])
    })
    it('idToken returns null when currentAuthStyle is not set', () => {
      expect(auth.token).toBeNull()
    })
    it('decodedToken returns null when currentAuthStyle is not set', () => {
      expect(auth.decodedToken).toBeNull()
    })
    it('currentAuthStyle returns null since currentAuthStyle not set in localStorage', () => {
      expect(auth.currentAuthStyle).toBeNull()
    })
    it('currentAuthDriver returns null when currentAuthStyle is not set', () => {
      expect(auth.currentAuthDriver).toBeNull()
    })
    it('currentAuthDriver returns null when currentAuthStyle is not registered in authStyles', () => {
      localStorage.setItem(LSKEYS.AUTH_STYLE, 'nope')
      expect(auth.currentAuthDriver).toBeNull()
    })
    it('sets currentAuthStyle when login() is called', () => {
      auth.login('TEST')
      expect(auth.currentAuthStyle).toBe('TEST')
    })
    it('calls correct AuthDriver.login() when login() is called', () => {
      auth.login('TEST')
      expect(testDriver.login).toHaveBeenCalled()
    })
  })
})
