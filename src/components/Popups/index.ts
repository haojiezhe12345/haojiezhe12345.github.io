import { createApp } from 'vue'
import Popups from './Popups.vue'

export const app = createApp(Popups);

export default app.mount('#popups') as InstanceType<typeof Popups>
