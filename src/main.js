import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './utils/modals'
import './styles/style.css'

const app = createApp(App)
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})

document.getElementById('vue-error')?.style.removeProperty('display')
