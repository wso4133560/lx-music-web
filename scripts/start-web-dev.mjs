import path from 'node:path'
import process from 'node:process'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import rendererConfig from '../build-config/renderer/webpack.config.dev.js'

const resolveFromRoot = (...segments) => path.join(process.cwd(), ...segments)

const config = {
  ...rendererConfig,
  target: 'web',
  output: {
    ...rendererConfig.output,
  },
  resolve: {
    ...rendererConfig.resolve,
    alias: {
      ...rendererConfig.resolve.alias,
      '@common/utils/nodejs$': resolveFromRoot('src/renderer/platform/web-stubs/nodejs.ts'),
      '@common/utils/download$': resolveFromRoot('src/renderer/platform/web-stubs/download.ts'),
      '@common/utils/musicMeta$': resolveFromRoot('src/renderer/platform/web-stubs/musicMeta.ts'),
      '@common/utils/lyricUtils/kg$': resolveFromRoot('src/renderer/platform/web-stubs/kgLyric.js'),
      'crypto$': resolveFromRoot('src/renderer/platform/web-stubs/crypto.js'),
      'dns$': resolveFromRoot('src/renderer/platform/web-stubs/dns.js'),
      'path$': resolveFromRoot('src/renderer/platform/web-stubs/path.js'),
      'os$': resolveFromRoot('src/renderer/platform/web-stubs/os.js'),
      'fs$': resolveFromRoot('src/renderer/platform/web-stubs/fs.js'),
      'fs/promises$': resolveFromRoot('src/renderer/platform/web-stubs/fsPromises.js'),
      'zlib$': resolveFromRoot('src/renderer/platform/web-stubs/zlib.js'),
      'querystring$': resolveFromRoot('src/renderer/platform/web-stubs/querystring.js'),
    },
    fallback: {
      ...rendererConfig.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      dns: false,
      http: false,
      https: false,
      url: false,
      net: false,
      tls: false,
      assert: false,
      stream: false,
      util: false,
      perf_hooks: false,
      zlib: false,
      os: false,
      child_process: false,
    },
  },
  plugins: rendererConfig.plugins.filter(plugin => plugin.constructor?.name !== 'ESLintWebpackPlugin'),
  module: {
    ...rendererConfig.module,
    rules: rendererConfig.module.rules.map(rule => {
      if (!rule.use || rule.test?.toString() != '/\\.tsx?$/') return rule
      return {
        ...rule,
        use: {
          ...rule.use,
          options: {
            ...rule.use.options,
            transpileOnly: true,
          },
        },
      }
    }),
  },
}

config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
  resource.request = resource.request.replace(/^node:/, '')
}))

delete config.output.library

const compiler = webpack(config)

const server = new WebpackDevServer({
  port: Number(process.env.WEB_PORT || 9080),
  host: process.env.WEB_HOST || '0.0.0.0',
  hot: true,
  historyApiFallback: true,
  static: {
    directory: path.join(process.cwd(), 'src/common/theme/images'),
    publicPath: '/theme_images',
  },
  client: {
    logging: 'warn',
    overlay: true,
  },
  setupMiddlewares: (middlewares, devServer) => {
    devServer.app?.use('/__lx_proxy__', async(req, res) => {
      const targetUrl = req.query?.url
      if (typeof targetUrl != 'string') {
        res.status(400).json({ error: 'missing url query param' })
        return
      }

      let requestUrl
      try {
        requestUrl = new URL(targetUrl)
      } catch {
        res.status(400).json({ error: 'invalid target url' })
        return
      }

      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = chunks.length ? Buffer.concat(chunks) : undefined

      const rawProxyHeaders = req.headers['x-lx-proxy-headers']
      let headers = { ...req.headers }
      if (typeof rawProxyHeaders == 'string') {
        try {
          headers = Object.fromEntries(JSON.parse(decodeURIComponent(rawProxyHeaders)))
        } catch {}
      }
      delete headers.host
      delete headers.connection
      delete headers['x-lx-proxy-headers']
      delete headers['content-length']

      try {
        const response = await fetch(requestUrl, {
          method: req.method,
          headers,
          body: req.method == 'GET' || req.method == 'HEAD' ? undefined : body,
          redirect: 'follow',
        })

        res.status(response.status)
        response.headers.forEach((value, key) => {
          if (key == 'content-encoding' || key == 'content-length' || key == 'transfer-encoding') return
          res.setHeader(key, value)
        })
        res.setHeader('x-lx-proxy-target', requestUrl.toString())

        const buffer = Buffer.from(await response.arrayBuffer())
        res.send(buffer)
      } catch (error) {
        res.status(502).json({
          error: error instanceof Error ? error.message : 'proxy request failed',
          targetUrl: requestUrl.toString(),
        })
      }
    })
    return middlewares
  },
}, compiler)

server.start().then(() => {
  const host = server.options.host
  const port = server.options.port
  console.log(`web dev server ready: http://${host}:${port}/?os=linux`)
}).catch(error => {
  console.error(error)
  process.exit(1)
})
