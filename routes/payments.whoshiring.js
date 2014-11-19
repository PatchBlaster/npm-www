var config = require('../config.js')
var stripe = require('stripe')(config.stripe.secretkey)

module.exports = payments

function payments(req, res) {
  if (req.method === 'GET') {
    return res.template('payments.whoshiring.ejs', {
      title: "Join the Who's Hiring Page", stripeKey: config.stripe.publickey
    })
  }

  if (req.method !== 'POST') return res.error(405, 'Method not allowed')

  req.maxLength = 255
  req.on('data', function (inc) {
    var token = JSON.parse(inc)

    stripe.charges.create({
      amount: token.amount,
      currency: "usd",
      card: token.id, // obtained with Stripe.js
      description: "Charge for " + token.email
    }, function (err, charge) {
      if (err) {
        console.error(err)
        return res.send(err, 500)
      }

      return res.send('OK', 200)
    });
  })
}