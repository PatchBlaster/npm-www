var config = require('../config.js')
var stripe = require('stripe')(config.stripe.secretkey)

module.exports = payments

function payments (req, res) {
  if (req.method === 'GET') {
    return res.template('payments.enterprisestarter.ejs', {
      title: "Get the npm Enterprise Starter License"
    , stripeKey: config.stripe.publickey
    })
  }

  if (req.method !== 'POST') return res.error(405, 'Method not allowed')

  req.maxLength = 255
  req.on('data', function (inc) {
    var token = JSON.parse(inc)

    stripe.customers.create({
      card: token.id, // obtained with Stripe.js
      plan: "enterprise-starter-pack",
      description: token.email + " npm Enterprise Starter License"
    }, function(err, charge) {
      if (err) {
        console.error(err)
        return res.send(err, 500)
      }

      return res.send('OK', 200)
    });
  })

}