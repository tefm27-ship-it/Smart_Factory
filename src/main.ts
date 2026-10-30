import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import AnimateNumber from './components/AnimateNumber.vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import './styles/base.css'
import './styles/campus.css'
import './styles/workshop.css'

const app = createApp(App)
app.use(ElementPlus)
app.component('AnimateNumber', AnimateNumber)
app.use(router)
app.mount('#app')
