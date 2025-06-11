import FloatMsgs from './FloatMsgs'

import { app as PopupsApp } from './Popups'
import LoginPopup from './Popups/LoginPopup.vue'
import InputPopup from './Popups/InputPopup.vue'
import SetAvatarPopup from './Popups/SetAvatarPopup.vue'
import SetPasswordPopup from './Popups/SetPasswordPopup.vue'
import UserHome from './Popups/UserHome.vue'

PopupsApp.component('loginPopup', LoginPopup)
PopupsApp.component('promptInputPopup', InputPopup)
PopupsApp.component('setAvatarPopup', SetAvatarPopup)
PopupsApp.component('setPasswordPopup', SetPasswordPopup)
PopupsApp.component('userHome', UserHome)

export default {
    FloatMsgs,
} 
