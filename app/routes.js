const {getJson} = require('simple-fetch')
const paypalSDK = require('paypal-rest-sdk')
const {openIdConnect} = paypalSDK

module.exports = function setRoutes (app) {
  // Primary OAuth request handler.
  // This handler fetches the user's Spotify playlists and followed artists,
  // then populates an install field with the entries.
  app.post('/', function (request, response) {
    const {install} = request.body

    if (!request.body.metadata.newValue) {
      // User has logged out. Reset schema.

      // erase merchant id

      response.json({install, proceed: true})
      return
    }

    const {token: auth, account} = request.body.authentications.account
    // const {oAuth} = authentications.account.account

    install.links = [{
      title: 'PayPal',
      description: 'Visit PayPal to manage your account.',
      href: 'https://www.paypal.com'
    }]

    paypalSDK.configure({
      mode: 'live',
      openid_client_id: account.service.oAuth.clientID,
      openid_client_secret: account.service.oAuth.clientSecret,
      openid_redirect_uri: 'https://www.cloudflare.com/apps/oauth/'
    })

    openIdConnect.userinfo.get(auth.token, function (error, userInfo) {
      if (error) {
        response.json({
          proceed: false,
          errors: [{type: '400', message: error.toString()}]
        })
        return
      }

      console.log(userInfo)
      install.options.merchantID = 'foo'
      response.json({install})
    })

    // getJson('https://api.sandbox.paypal.com/v1/oauth2/token/userinfo?schema=openid', {
    //   headers: {
    //     authorization: `${auth.type} ${auth.token}`
    //   }
    // })
    //   .catch(error => {
    //     console.log('>>', error)
    //     response.json({
    //       proceed: false,
    //       errors: [{type: '400', message: error.toString()}]
    //     })
    //   })
    //   .then(res => {
    //     console.log(res)

    //     install.options.merchantID = 'foo'
    //     response.json({install})
    //   })
  })

  // Account metadata handler.
  // This handler fetches user info and populates the login entry with user's info.
  app.get('/account-metadata', function (request, response) {
    getJson('https://api.spotify.com/v1/me', {
      headers: {
        authorization: request.headers.authorization
      }
    })
      .catch(error => {
        response.json({
          proceed: false,
          errors: [{type: '400', message: error.toString()}]
        })
      })
      .then(res => {
        response.json({
          metadata: {
            email: res.email,
            username: res.display_name || res.id,
            userId: res.id
          }
        })
      })
  })

  app.get('/healthcheck', function (request, response) {
    response.sendStatus(200)
  })
}
