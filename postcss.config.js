/**
 * 自定义 PostCSS 插件：支持 Vue 深度选择器
 * 将 :deep()、/deep/、::v-deep 统一转换为 ::v-deep 格式
 * 以兼容 Vue 2 的 vue-loader
 */
const deepSelectorPlugin = () => {
  return {
    postcssPlugin: 'postcss-vue-deep-selector',
    Rule(rule) {
      if (!rule.selector) return

      let newSelector = rule.selector

      // 处理 :deep(.selector) -> ::v-deep .selector
      // 支持 :deep(.class)、:deep(#id)、:deep([attr])、:deep(tag) 等
      newSelector = newSelector.replace(/:deep\(([^)]+)\)/g, '::v-deep $1')

      // 处理 /deep/ -> ::v-deep (某些旧版写法)
      newSelector = newSelector.replace(/\/deep\//g, '::v-deep')

      // 如果选择器有变化，更新它
      if (newSelector !== rule.selector) {
        rule.selector = newSelector
      }
    }
  }
}
deepSelectorPlugin.postcss = true

module.exports = {
  plugins: [require('autoprefixer'), deepSelectorPlugin]
}
