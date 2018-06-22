export class LocalStorageMock {
  constructor () { this.store = {} }
  clear () { this.store = {} }
  getItem (key) { return this.store[key] || null }
  setItem (key, value) { this.store[key] = value.toString() }
  removeItem (key) { delete this.store[key] }
}
export const testDriver = {
  login: jest.fn(),
  logout: jest.fn(),
  backgroundLogin: jest.fn(cb => cb()),
  token: 'testtoken',
  decodedToken: {
    decoded: true
  },
  init: jest.fn(auth => {
    if (auth.reactiveChange) {
      auth.reactiveChange('token', testDriver.token)
      auth.reactiveChange('decodedToken', testDriver.decodedToken)
    }
    auth.configureHttp()
  })
}
