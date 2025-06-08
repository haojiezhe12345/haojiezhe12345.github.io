import { createApp } from 'vue'
import './style.css'
import * as index from '.'
import App from './App.vue'

Object.assign(window, index)

createApp(App).mount('#app')
