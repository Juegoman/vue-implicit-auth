# vue-implicit-auth
A Vue.js plugin that handles requesting and refreshing id tokens used to authenticate with an OAuth2 implicit grant using server.
Presently contains a module to handle Azure Active Directory OAuth2 token retrieval and refreshing.
## Installation
`npm install --save vue-implicit-auth`
## Usage
vue-implicit-auth requires the use of 'history' mode on vue-router.
### Installing the plugin
```javascript
import { AuthPlugin, AADDriver } from 'vue-implicit-auth'
Vue.use(AuthPlugin, {
  // authStyles contains modules which handle the retrieval and refreshing of id tokens
  authStyles: {
    "AAD": new AADDriver({
      TENANT: "Azure Tenant",
      CLIENT_ID: "Application id in Azure",
      REDIRECT_URI: "URI to redirect to after a login/logout request"
    })
  },
  // baseURL is where the internal configured axios instance will send its requests
  baseURL: 'url of your OAuth2 implicit grant using server.'
})
```
### $auth object
Interface to authentication functions within vue components
 - styles: array of registered authStyles
 - idToken: returns the currently stored idToken of null if not logged in
 - decodedToken: returns the decoded id token or null if not logged in
 - currentAuthDriver: returns the currently active AuthDriver object or null if not logged in
 - currentAuthStyle: returns the currently active authStyle or null if not logged in
 - login(style): requests an idToken according to the authStyle that is passed in. Will redirect in most cases.
 - logout(): deletes the currently stored idToken and redirects to the authStyle's logout endpoint
```vue
<template>
<div>
  <h3>List the registered authStyles:</h3>
  <ul>
    <li
      v-for="style in styles"
      :key="style">
      {{ style }}
    </li>
  </ul>
  <button
    v-for="style in styles"
    :key="style"
    @click="login(style)">
    Login with {{ style }}
  </button>
  <h3>Access the currently active AuthStyle name: </h3>
  <p>{{ currentAuthStyle }}</p>
  <h3>Access the currently active AuthDriver object with $auth.currentAuthDriver</h3>
  <div v-if="isLoggedIn">
    <h3>View the stored id token:</h3>
    <pre>{{ idToken }}</pre>
    <h3>Access properties of stored id token:</h3>
    <pre>{{ decodedToken }}</pre>
    <button @click="logout">Logout</button>
  </div>
</div>
</template>
<script>
export default {
  name: 'auth-plugin-example',
  computed: {
    styles () {
      // returns an array of registered authStyles
      return this.$auth.styles
    },
    idToken () {
      // returns the currently stored idToken of null if not logged in
      return this.$auth.idToken
    },
    decodedToken () {
      // returns the decoded id token or null if not logged in
      return this.$auth.decodedToken
    },
    currentAuthDriver () {
      // returns the currently active AuthDriver object or null if not logged in
      return this.$auth.currentAuthDriver
    },
    currentAuthStyle () {
      // returns the currently active authStyle or null if not logged in
      return this.$auth.currentAuthStyle
    },
    isLoggedIn () {
      // if idToken is not null then we are logged in
      return this.idToken !== null
    }
  },
  methods: {
    login (style) {
      // requests an idToken according to the authStyle that is passed in. Will redirect in most cases.
      this.$auth.login(style)
    },
    logout () {
      // deletes the currently stored idToken and redirects to the authStyle's logout endpoint
      this.$auth.logout()
    }
  }
}
</script>
```
### $http object
pre-configured [axios](https://github.com/axios/axios) instance with custom interceptor to automatically refresh the id token and retry requests on a 401 error.
 - Attaches bearer id token to Authorization header
 - Only configured when logged in, is null when not logged in.
```javascript
methods: {
  makeGetRequest () {
    this.$http.get('/get-endpoint')
      .then(response => {
        this.message = response.data.message
      })
  }
}
```
## Extension
An object which conforms to the AuthDriver interface:
 * string idToken (getter/setter)
 * object decodedToken (getter)
 * void init(Authentication) handle returning from redirect, call Authentication.configureHttp()
 * void login() handle flow for retrieving an id token, redirecting if necessary
 * Promise\<string> backgroundLogin() handle flow for silently retrieving an id token from an OAuth2 provider
 * void logout() handle flow for clearing id token data and calling the logout endpoint on an OAuth2 provider
