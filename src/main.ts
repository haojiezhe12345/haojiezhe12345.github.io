import { createApp } from 'vue'
import './style.css'
import * as index from '.'
import components from './components'
import App from './App.vue'

Object.assign(window, index)
Object.assign(window, components)

createApp(App).mount('#app')
