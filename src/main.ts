import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import vue3videoPlay from 'vue3-video-play'
import 'element-plus/dist/index.css'
import 'vue3-video-play/dist/style.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(vue3videoPlay)
app.mount('#app')
