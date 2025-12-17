<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <div :class="moduleStyle.text">123123</div>
    <div class="text2">123123</div>
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  }
}
</script>

<style lang="less" module="moduleStyle">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.text {
  color: red;
}
</style>
<style lang="less" scoped>
.text2 {
  color: red;
}
</style>
