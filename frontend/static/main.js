import { createApp } from 'vue'
import { router } from './router/index.js'

const app = createApp({
  template: '<router-view></router-view>', 
  data() {
    return {
      count: 0
    }
  }
})

app.use(router)
app.mount('#app')

