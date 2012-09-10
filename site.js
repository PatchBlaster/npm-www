// this is the request handler for the site.

module.exports = site

var router = require("./router.js")
, decorate = require('./decorate.js')
, config = require("./config.js")
, url = require("url")
, path = require("path")

, Keygrip = require("keygrip")

, StringDecoder = require('string_decoder').StringDecoder
, qs = require("querystring")


config.keys = new Keygrip(config.keys)

function site (req, res) {
  // only allow access via the canonical hostname
  if (config.canon(req, res)) return

  decorate(req, res, config)

  // kludge!  remove this once we figure out wtf is going on.
  var timeout = setTimeout(function () {
    res.log.error('TIMEOUT! %s', req.url, res._header)
    var er = new Error('Request timed out')
    res.error(500, er)
    setTimeout(function () {
      res.socket.destroy()
      res.emit('error')
    }, 5000)
  }, 30*1000) // nothing should take 30s ever.

  // maybe the issue is that it's sometimes not flushing?
  // flush after 2s, that might make it go away?
  var flusher = setTimeout(function () {
    res._flush()
  })

  res.on('finish', function () {
    clearTimeout(timeout)
    clearTimeout(flusher)
  })

  var parsed = url.parse(req.url)
  var pathname = parsed.pathname
  var normalPathname = path.normalize(pathname).replace(/\\/g, '/');

  // multiple //// chars in the path are stupid and should not be,
  // nor should empty search queries, since that's just dumb.
  // make things a bit more canonical.
  if (pathname !== normalPathname || parsed.search === '?') {
    var tp = normalPathname
    if (parsed.query)
      tp += parsed.search
    return res.redirect(tp, 301)
  }

  var route = router.match(normalPathname);
  if (!route) return res.error(404)

  Object.keys(route).forEach(function (k) {
    req[k] = route[k]
  })

  route.fn(req, res)

  // now check for anything added afterwards.
  if (typeof req.maxLen === 'number') {
    var cl = req.headers['content-length']
    res.setHeader('max-length', ''+req.maxLen)
    if (!cl) return res.error(411) // length required.
    if (cl > req.maxLen) return res.error(413) // too long.
  }

  if (req.listeners('json').length) {
    if (!req.headers['content-type'].match(/\/(x-)?json$/)) {
      return res.error(415)
    }
    req.on('body', function (b) {
      try {
        var j = JSON.parse(b)
      } catch (e) {
        e.statusCode = 400
        return res.error(e)
      }
      req.emit('json', j)
    })
  }

  if (req.listeners('form').length) {
    // XXX Add support for formidable uploading, as well
    if (req.headers['content-type'] !==
        'application/x-www-form-urlencoded') {
      return res.error(415)
    }
    req.on('body', function (data) {
      req.emit('form', qs.parse(data))
    })
  }

  if (req.listeners('body').length) {
    var b = ''
    , d = new StringDecoder
    req.on('data', function (c) {
      b += d.write(c)
    })
    req.on('end', function () {
      req.emit('body', b)
    })
  }
}
