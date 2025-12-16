import { defineConfig } from '@rsbuild/core'
import { pluginVue2 } from '@rsbuild/plugin-vue2'
const { pluginLess } = require('@rsbuild/plugin-less')
export default defineConfig({
  plugins: [
    pluginVue2({
      vueLoaderOptions: {
        cssModules: {
          localIdentName: '[path][name]__[local]-[hash:base64:5]'
        }
      }
    }),
    pluginLess()
  ],
  source: {
    // 指定入口文件
    entry: {
      index: './src/main.js'
    }
  },
  html: {
    template: './public/index.html',
    templateParameters: (compilation, assets, assetTags) => {
      return {
        title: 'test',
        assetPrefix: assets.publicPath
      }
    }
  },
  output: {
    cssModules: {
      auto: true
    }
  }
})
