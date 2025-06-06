import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import components from './components'
import FloatMsgs from './components/FloatMsgs.vue'

console.log('Loading ES modules')

components.FloatMsgs = createApp(FloatMsgs).mount('#floatMsgs') as InstanceType<typeof FloatMsgs>
Object.assign(window, components)

createApp(App).mount('#app')

console.log('ES modules loaded')
window.esmLoaded = true
/*
If vite legacy is not loaded, `ensureJsLoaded` will not exist here because `index.js` executes after all ES modules

If ES modules are loaded with vite legacy, `ensureJsLoaded` may exist

  - If vite legacy takes longer to load than `index.js`, `index.js` will fire first, register `ensureJsLoaded`, but do not enter due to a ESM check inside it
    For this case, `index.js` have to be loaded again after ESM is loaded

  - If `index.js` takes longer to load, making time for ESM to load, then `index.js` will run normally after ESM

*/
window.ensureJsLoaded && window.ensureJsLoaded()
