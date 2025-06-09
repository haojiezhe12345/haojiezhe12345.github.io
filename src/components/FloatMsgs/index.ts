import { createApp } from 'vue'
import FloatMsgs from "./FloatMsgs.vue"

export default createApp(FloatMsgs).mount('#floatMsgs') as InstanceType<typeof FloatMsgs>
