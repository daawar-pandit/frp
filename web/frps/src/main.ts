import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'

import './assets/tailwind.css'
// import './assets/custom.css' // Todo: Delete after verifying logic move
// import './assets/dark.css'   // Todo: Delete after verifying logic move

const app = createApp(App)

app.use(router)

app.mount('#app')
