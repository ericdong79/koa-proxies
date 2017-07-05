const path = require('path')
const Koa = require('koa')
const history = require('koa-connect-history-api-fallback')
const statics = require('koa-static')
const HttpsProxyAgent = require('https-proxy-agent')

const proxy = require('..')

const agentUrl = process.env.http_proxy || process.env.https_proxy

const proxyTable = {
  '/octocat': 'https://api.github.com/users',
  '/api': {
    target: 'http://localhost:8111',
    headers: {
      'X_HOST_S': 'google.com'
    }
  },
  '/users': {
    target: 'https://api.github.com',
    changeOrigin: true,
    logs: true,
    agent: proxy ? new HttpsProxyAgent(agentUrl) : null,
    headers: {
      'XHostS': 'google.com'
    },
    rewrite: path => path.replace(/\/node$/, '/vagusx'),
    events: {
      error (err, req, res) {
        console.log(err)
      },
      proxyRes (proxyRes, req, res) {
        res.setHeader('X-Special-Test-Header', 'proxy')
      }
    }
  }
}

const app = new Koa()

app.use((ctx, next) => {
  return next()
  .then(() => {
    ctx.request.headers['X-Request-Header'] = 'test'
    ctx.response.headers['X-Response-Header'] = 'test'
  })
})

Object.keys(proxyTable).forEach(context => {
  let options = proxyTable[context]
  if (typeof options === 'string') {
    options = {
      target: options,
      changeOrigin: true,
      logs: true
    }
  }
  app.use(proxy(context, options))
})

// history fallback
app.use(history({
  verbose: true
}))

// static
app.use(statics(path.resolve('examples/statics')))

app.listen(12306, e => console.log(e || 'listening at port 12306'))