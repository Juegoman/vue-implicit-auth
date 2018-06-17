import { shallowMount, createLocalVue } from '@vue/test-utils'
import AuthPlugin from '../src/AuthPlugin'
import Authentication from '../src/Authentication'
import LSKEYS from '../src/LSKEYS'
import { LocalStorageMock, testDriver } from './testutil'

global.localStorage = new LocalStorageMock()

beforeEach(() => {
  localStorage.clear()
})
describe('AuthPlugin.js', () => {
  let localVue, wrapper
  beforeEach(() => {
    localVue = createLocalVue()
  })
  it('requires authStyle in options', () => {
    let tryAction = () => {
      localVue.use(AuthPlugin, { baseURL: '' })
    }
    expect(tryAction).toThrow('authStyles are required for Authentication')
  })
  it('requires baseURL in options', () => {
    let tryAction = () => {
      localVue.use(AuthPlugin, { authStyles: {} })
    }
    expect(tryAction).toThrow('baseURL is required for Authentication')
  })
  describe('currentAuthStyle is set in localStorage', () => {
    beforeEach(() => {
      localStorage.setItem(LSKEYS.AUTH_STYLE, 'TEST')
      localVue.use(AuthPlugin, {
        authStyles: {
          'TEST': testDriver
        },
        baseURL: 'test'
      })
      wrapper = shallowMount({ template: '<div></div>' }, { localVue })
    })
    it('calls AuthDriver init() function when currentAuthStyle is loaded from localStorage', () => {
      expect(testDriver.init).toHaveBeenCalled()
    })
    it('currentAuthDriver is set to correct AuthDriver', () => {
      expect(wrapper.vm.$auth.currentAuthDriver).toBe(testDriver)
    })
    it('sets $http instance property when init() is able to complete', () => {
      expect(wrapper.vm.$http).not.toBeNull()
    })
    it('configureHttp() configures Authentication header for $http instance', () => {
      expect(wrapper.vm.$http.defaults.headers.Authorization).toBe('Bearer ' + testDriver.idToken)
    })
    it('calls logout on correct AuthDriver', () => {
      wrapper.vm.$auth.logout()
      expect(testDriver.logout).toHaveBeenCalled()
    })
    it('returns idToken from AuthDriver', () => {
      expect(wrapper.vm.$auth.idToken).toBe(testDriver.idToken)
    })
    it('returns decodedToken from AuthDriver', () => {
      expect(wrapper.vm.$auth.decodedToken).toBe(testDriver.decodedToken)
    })
  })
  describe('$auth instance property', () => {
    beforeEach(() => {
      localVue.use(AuthPlugin, {
        authStyles: {
          'TEST': testDriver,
          'test2': {},
          'testStyle': {}
        },
        baseURL: 'test'
      })
      wrapper = shallowMount({ template: '<div></div>' }, { localVue })
    })
    it('calls login on correct AuthDriver', () => {
      wrapper.vm.$auth.login('TEST')
      expect(testDriver.login).toHaveBeenCalled()
    })
    it('sets currentAuthStyle to localStorage', () => {
      wrapper.vm.$auth.login('TEST')
      expect(localStorage.getItem(LSKEYS.AUTH_STYLE)).toBe('TEST')
    })
    it('exposes currentAuthStyle to $auth object', () => {
      wrapper.vm.$auth.login('TEST')
      expect(wrapper.vm.$auth.currentAuthStyle).toBe('TEST')
    })
    it('returns names of all registered authStyles when $auth.styles is called', () => {
      expect(wrapper.vm.$auth.styles).toEqual(['TEST', 'test2', 'testStyle'])
    })
    it('$auth.currentAuthStyle returns null if no authStyle is set', () => {
      expect(wrapper.vm.$auth.currentAuthStyle).toBeNull()
    })
    it('$auth.currentAuthDriver returns null if no authStyle is set', () => {
      expect(wrapper.vm.$auth.currentAuthDriver).toBeNull()
    })
    it('$auth.currentAuthDriver returns null if nonexistent authStyle is set', () => {
      wrapper.vm.$auth.login('nope')
      expect(wrapper.vm.$auth.currentAuthDriver).toBeNull()
    })
    it('$auth.idToken returns null if no authStyle is set', () => {
      expect(wrapper.vm.$auth.idToken).toBeNull()
    })
    it('$auth.decodedToken returns null if no authStyle is set', () => {
      expect(wrapper.vm.$auth.decodedToken).toBeNull()
    })
  })
})
