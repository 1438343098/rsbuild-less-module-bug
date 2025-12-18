import { defineConfig } from '@rsbuild/core'
import { pluginVue2 } from '@rsbuild/plugin-vue2'
import { pluginBabel } from '@rsbuild/plugin-babel'
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill'
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
const resolve = dir => path.resolve(__dirname, dir)
const APP_ENV = process.env.APP_ENV || 'prodTx'

const initKzEnvScript = () => {
  const envFile = path.resolve(
    __dirname,
    `node_modules/@kuaizi/kz-envs/envs/.env.${APP_ENV}`
  )
  if (!fs.existsSync(envFile)) {
    return ''
  }
  const envConfig = dotenv.parse(fs.readFileSync(envFile))
  Object.entries(envConfig).forEach(([key, value]) => {
    if (key === 'NODE_ENV') {
      process.env.NODE_ENV = process.env.NODE_ENV || value
    } else {
      process.env[`VUE_${key}`] = value
    }
  })
  const scriptFile = path.resolve(
    __dirname,
    `node_modules/@kuaizi/kz-envs/dist/env.${APP_ENV}.js`
  )
  if (!fs.existsSync(scriptFile)) {
    return ''
  }
  return `<script>${fs.readFileSync(scriptFile).toString()}</script>`
}

const kzENVScript = initKzEnvScript()
const cdnBase = process.env.VUE_APP_CDN_URL
  ? `https:${process.env.VUE_APP_CDN_URL}`
  : ''
const cdn = {
  js: cdnBase
    ? [
        // `https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js`,
        `${cdnBase}/common/npm/vue/2.6.11/vue.js`,
        `${cdnBase}/common/npm/vuex/3.1.1/vuex.min.js`,
        `${cdnBase}/common/npm/vue-router/3.4.6/vue-router.min.js`,
        `${cdnBase}/common/npm/vue-i18n/8.16.0/vue-i18n.js`,
        `${cdnBase}/common/npm/element-ui/2.14.1/index.js`,
        `${cdnBase}/common/npm/axios/0.19.2/axios.min.js`
      ]
    : [],
  css: []
}
const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    pluginNodePolyfill(),
    pluginBabel({
      include: [/src/, /@kuaizi[\\/]saas-components/],
      babelLoaderOptions: {
        presets: [
          ['@babel/preset-env', { targets: 'defaults' }],
          ['@vue/babel-preset-jsx', { compositionAPI: false }]
        ]
      }
    }),
    pluginVue2(),
    pluginBasicSsl()
  ],

  source: {
    entry: {
      index: './src/main.js'
    },
    // 兼容window对象
    include: [/@kuaizi[\\/]saas-components/],
    define: {
      ...(function () {
        return Object.fromEntries(
          // 解决兼容 process.env 变量在 Vue 2 中的问题
          Object.entries(process.env).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value)
          ])
        )
      })()
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // 自定义别名，解决 Vue 2 中 import 路径问题
      vue$: require.resolve('vue/dist/vue.runtime.esm.js')
      // vuex$: require.resolve('vuex')
    }
  },

  html: {
    template: './public/index.html',
    templateParameters: (compilation, assets, assetTags) => {
      return {
        // 兼容 Vue CLI 的 htmlWebpackPlugin 语法
        htmlWebpackPlugin: {
          options: {
            title: 'Kuaizi™ - 内容商业一站式AI应用平台',
            cdn,
            kzCDN: process.env.VUE_APP_CDN_URL,
            npsId: process.env.VUE_APP_NPS_ID || '',
            personalNpsId: process.env.VUE_APP_PERSONAL_NPS_ID || '',
            kzENVScript,
            assetPrefix: process.env.VUE_APP_CDN_URL
              ? `${process.env.VUE_APP_CDN_URL}/plus`
              : '/',
            content: ''
          }
        }
      }
    },
    // 自动注入 CDN 脚本
    tags: (tags, { title, cdn, kzCDN, npsId, personalNpsId, kzENVScript }) => {
      // 注入 CDN JS 文件
      if (cdn && cdn.js && cdn.js.length > 0) {
        cdn.js.forEach(jsUrl => {
          tags.headTags.push({
            tag: 'script',
            attrs: { src: jsUrl },
            innerHTML: ''
          })
        })
      }
      return tags
    }
  },

  output: {
    assetPrefix: isProd ? process.env.VUE_APP_CDN_URL + '/plus/' : '/',
    filename: {
      js: 'js/[name].[contenthash:8].js',
      css: 'css/[name].[contenthash:8].css',
      asset: 'assets/[name].[contenthash:8][ext]'
    },
    sourceMap: {
      js: false,
      css: false
    },
    // 配置 CSS Module
    cssModules: {
      // 自动识别 CSS Module（.module.css 或 Vue 的 <style module>）
      auto: true,
      localIdentName: '[local]--[hash:base64:5]'
    }
  },

  // Vue 2 项目需要关闭 experiments.css
  experiments: {
    css: false
  },

  server: {
    port: 8080,
    https: true
  },
  // 关闭性能提示
  performance: {
    hints: false
  },

  tools: {
    rspack(config, { addRules }) {
      // externals
      config.externals = {
        vue: 'Vue',
        // vuex: 'Vuex',
        'vue-router': 'VueRouter',
        'vue-i18n': 'VueI18n',
        'element-ui': 'ELEMENT',
        axios: 'axios'
      }

      // 过滤掉所有 less 和 css 相关规则，由自定义的 less 和 css 规则接管
      config.module.rules = (config.module.rules || []).filter(rule => {
        if (!rule.test) return true
        const testStr = rule.test.toString()
        // 过滤掉 less 和 css 规则
        if (testStr.includes('less')) return false
        if (
          testStr.includes('css') ||
          testStr.includes('pcss') ||
          testStr.includes('postcss')
        )
          return false
        return true
      })

      // shared vars
      const lessVars = {
        VUE_APP_CDN_URL: `'${process.env.VUE_APP_CDN_URL || ''}'`,
        colorPrimary: '#0066ff',
        colorPrimaryLight8: '#d4e7ff',
        colorSuccess: '#3ec07d',
        colorWarning: '#f97c56',
        colorDanger: '#f56c6c',
        colorBg: 'white',
        colorBorder: '#999',
        colorText: '#777b7e',
        colorTitle: '#1d2328',
        colorDark: 'rgba(0, 0, 0, 0.75)',
        headerHeight: '64px',
        minWidth: '1200px',
        sideBarWidth: '210px',
        font: '14px',
        fontSmall: '12px',
        bg: 'white'
      }

      // -------------------
      // 加新的 less 规则（保证 globalVars 生效）
      // 匹配 .less 和 .vue.less（Vue SFC 中的 less 样式）
      // -------------------
      config.module.rules.unshift({
        test: /\.less$/,
        type: 'javascript/auto',
        use: [
          'vue-style-loader',
          {
            loader: 'css-loader',
            options: {
              // 使用 auto 函数自动检测是否需要启用 CSS Modules
              modules: {
                auto: (resourcePath, resourceQuery) => {
                  // 检查 resourceQuery 中是否包含 module
                  const hasModule =
                    resourceQuery && resourceQuery.includes('module')
                  // if (hasModule) {
                  //   console.log('🔍 CSS Modules enabled for:', resourcePath, resourceQuery)
                  // }
                  return hasModule
                },
                mode: 'local',
                localIdentName: '[local]--[hash:base64:5]',
                exportLocalsConvention: 'asIs',
                namedExport: false
              },
              importLoaders: 2
              // esModule: false
            }
          },
          'postcss-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
                globalVars: lessVars,
                math: 'always' // 恢复 Less 3.x 的数学运算行为
              }
              // additionalData: sharedLessImports 全局导入的样式
            }
          }
        ]
      })

      // CSS 规则
      config.module.rules.unshift({
        test: /\.css$/,
        type: 'javascript/auto',
        use: [
          'vue-style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: (resourcePath, resourceQuery) => {
                  return resourceQuery && resourceQuery.includes('module')
                },
                mode: 'local',
                localIdentName: '[local]--[hash:base64:5]',
                exportLocalsConvention: 'asIs',
                namedExport: false
              },
              importLoaders: 1
              // esModule: false
            }
          },
          'postcss-loader'
        ]
      })

      // svg + glsl rules
      addRules([
        {
          test: /\.svg$/,
          include: [resolve('src/asset/icons/svg')],
          use: [
            {
              loader: require.resolve('svg-sprite-loader'),
              options: {
                symbolId: 'icon-[name]'
              }
            }
          ]
        }
      ])
      // console.log('rules:', JSON.stringify(config.module.rules.map(r => r.test?.toString()), null, 2))
    }
  }
})
