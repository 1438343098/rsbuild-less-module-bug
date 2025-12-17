import { defineConfig } from '@rsbuild/core'
import { pluginVue2 } from '@rsbuild/plugin-vue2'
// 注意：移除了手动引入的 VueLoaderPlugin
import { pluginLess } from '@rsbuild/plugin-less' // 建议改用 import 语法

export default defineConfig({
  plugins: [
    // 配置 pluginVue2 插件以支持 style module
    pluginVue2({
      vueLoaderOptions: {
        // 关键配置：启用 CSS Modules 并设置类名格式
        cssModules: {
          localIdentName: '[local]--[hash:base64:5]' // 使用了更简洁的类名格式
        }
      }
    }),
    pluginLess()
  ],
  source: {
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
  // 确保 CSS Modules 的自动识别开启
  output: {
    cssModules: {
      auto: resourcePath => {
        // 对 .module.css/.module.less 文件或 Vue 文件内的 scoped/style module 启用 CSS Modules
        return (
          /\.module\.\w+$/.test(resourcePath) || resourcePath.includes('.vue')
        )
      }
    }
  },
  // 重要：Vue 2 项目需要关闭 experiments.css
  experiments: {
    css: false
  }
})
