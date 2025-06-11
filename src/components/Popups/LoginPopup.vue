<template>
    <div class="loginPopup">
        <div v-if="screen == 'usernameLogin'">
            <h2><span class="ui zh">注册/登录</span><span class="ui en">Log in / Register</span></h2>

            <div class="inputHelperText"><span class="ui zh">用户名 (昵称)</span><span class="ui en">Username (nickname)</span></div>
            <input type="text" v-model="loginUsername" autocomplete="username" style="margin-bottom: 0;" @keypress="e => e.key == 'Enter' && loginUsername.length > 0 && searchUser()">

            <div class="inputHelperText" style="margin: 0.375rem 0 1rem;">
                <span class="ui zh">未注册的用户将自动注册</span><span class="ui en">Newcomers will create an account automatically</span>
            </div>

            <p class="altLoginOption" @click="screen = 'emailLogin'; loginUser = null">
                <span class="ui zh">邮箱登录</span><span class="ui en">Email login</span>
            </p>

            <button class="okBtn" :disabled="loginUsername.length == 0" @click="searchUser()">
                <span class="ui zh">下一步 →</span><span class="ui en">Continue →</span>
            </button>
        </div>

        <div v-if="screen == 'emailLogin'">
            <h2><span class="ui zh">邮箱登录</span><span class="ui en">Log in with email</span></h2>

            <form>
                <template v-if="loginUser">
                    <div class="emailLoginInfo">
                        <img :src="convertAvatarPath(loginUser.avatar)">
                        <div>{{ loginUser.name }}</div>
                    </div>
                    <div v-if="loginUser.hasEmail" class="inputHelperText">
                        <span class="ui zh">该账号已绑定邮箱<br>在下方输入绑定的邮箱以登录:</span><span class="ui en">This account is linked to an email<br>Enter your email to log in:</span>
                    </div>
                </template>
                <div v-else class="inputHelperText"><span class="ui zh">邮箱</span><span class="ui en">Email</span></div>

                <input v-if="loginUser ? loginUser.hasEmail : true" type="text" v-model="loginEmail" autocomplete="email">

                <template v-if="loginUser ? loginUser.hasPassword : true">
                    <div class="inputHelperText">
                        <template v-if="loginUser">
                            <span class="ui zh">密码</span><span class="ui en">Password</span>
                        </template>
                        <template v-else>
                            <span class="ui zh">密码 (没有可不填)</span><span class="ui en">Password (omit if not set)</span>
                        </template>
                        <span class="help" @click="gotoForgotPassword"><span class="ui zh">忘记密码</span><span class="ui en">Forgot password</span></span>
                    </div>
                    <input type="password" v-model="loginPassword" autocomplete="current-password" @keypress="e => e.key == 'Enter' && (loginEmail.length > 0 || loginPassword.length > 0) && emailLogin()">
                </template>
            </form>

            <p v-if="!loginUser" class="altLoginOption" @click="screen = 'usernameLogin'">
                <span class="ui zh">用户名登录</span><span class="ui en">Username login</span>
            </p>

            <button class="okBtn" :disabled="loginEmail.length == 0 && loginPassword.length == 0" @click="emailLogin()">
                <span class="ui zh">下一步 →</span><span class="ui en">Continue →</span>
            </button>

            <button v-if="loginUser" class="backBtn" @click="screen = 'userFind'"></button>
        </div>

        <div v-if="screen == 'userFind'">
            <h2 v-if="userFindResult.length == 1"><span class="ui zh">这是您的账号吗?</span><span class="ui en">Is this your account?</span></h2>
            <h2 v-else><span class="ui zh">哪个是您的账号?</span><span class="ui en">Which account is yours?</span></h2>

            <div v-for="(item, index) in userFindResult" class="userFindItem" @click="userFindResult.length > 1 && userFindLogin(index)">
                <div class="userinfo">
                    <img :src="convertAvatarPath(item.avatar)">
                    <div>
                        <div class="username">{{ item.name }}</div>
                        <div class="userdetail">
                            <span>UID: {{ item.id }}&nbsp;&nbsp;</span>
                            <span>
                                <span class="ui zh">注册时间: </span><span class="ui en">Joined </span>
                                {{ new Date(item.create_time * 1000).toLocaleDateString() }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="actionBtnContainer">
                <button v-if="userFindResult.length == 1" @click="gotoRegister()"><span class="ui zh">不, 注册新账号</span><span class="ui en">No, register new account</span></button>
                <button v-if="userFindResult.length == 1" @click="userFindLogin()"><span class="ui zh">是, 立即登录</span><span class="ui en">Yes, log in now</span></button>
                <p v-else @click="gotoRegister()"><span class="ui zh">都不是, 注册新账号</span><span class="ui en">None is mine, register new account</span></p>
            </div>

            <button class="backBtn" @click="screen = 'usernameLogin'"></button>
        </div>

        <div v-if="screen == 'register'">
            <h2><span class="ui zh">注册账号</span><span class="ui en">Registration</span></h2>

            <img ref="avatarPreview" class="setAvatarImg" :src="`${baseUrl}api/data/images/defaultAvatar.png`" @click="$refs.avatarInput.click()" style="margin-bottom: 0;">
            <input ref="avatarInput" type="file" accept="image/*" @change="previewAvatar()" style="display: none;" />
            <div class="inputHelperText" style="text-align: center; margin: 0.25rem 0;"><span class="ui zh">点击设置头像</span><span class="ui en">Tap to set avatar</span></div>

            <div class="inputHelperText"><span class="ui zh">昵称</span><span class="ui en">Enter a nickname</span></div>
            <input type="text" v-model="regName">

            <label class="setting-switch" style="margin: 0.25rem 0;">
                <span class="ui zh">绑定邮箱</span><span class="ui en">Link email</span>
                <input type="checkbox" v-model="regUseEmail" :disabled="regRequireEmail">
            </label>

            <form v-if="regUseEmail">
                <div v-if="regRequireEmail" class="inputHelperText">
                    <span class="ui zh">该昵称已被使用<br>要使用重复的昵称，必须绑定邮箱</span>
                    <span class="ui en">This nickname is already taken<br>To use a same name, you must provide an email</span>
                </div>
                <div v-else class="inputHelperText"><span class="ui zh">邮箱</span><span class="ui en">Enter your email</span></div>
                <input type="text" v-model="regEmail" autocomplete="email">

                <div class="inputHelperText"><span class="ui zh">设置密码 (可选)</span><span class="ui en">Password (optional)</span></div>
                <input type="password" v-model="regPassword" autocomplete="current-password">

                <template v-if="regPassword.length > 0">
                    <div class="inputHelperText"><span class="ui zh">确认密码</span><span class="ui en">Confirm password</span></div>
                    <input type="password" v-model="regPasswordConfirm">
                </template>
            </form>

            <button class="okBtn" :disabled="regName.length == 0 || (regUseEmail && (regEmail.length == 0 || (regPassword.length > 0 && regPassword != regPasswordConfirm)))" @click="register()">
                <span class="ui zh">注册 →</span><span class="ui en">Register →</span>
            </button>

            <button class="backBtn" @click="screen = userFindResult.length == 0 ? 'usernameLogin' : 'userFind'"></button>
        </div>
    </div>
</template>

<script lang="ts">
// @ts-nocheck
import { baseUrl, User } from '../..'

export default {
    data: () => ({
        baseUrl: baseUrl,

        screen: 'usernameLogin',

        loginUsername: '',
        loginEmail: '',
        loginPassword: '',

        userFindResult: [],
        loginUser: null,

        regName: '',
        regEmail: '',
        regPassword: '',
        regPasswordConfirm: '',
        regUseEmail: false,
        regRequireEmail: false,
    }),

    methods: {
        convertAvatarPath: User.convertAvatarPath,

        searchUser() {
            XHR.get('user/find', {
                name: this.loginUsername,
                email: isEmail(this.loginUsername) ? this.loginUsername : undefined,
            }).then(r => {
                this.userFindResult = r
                if (r.length > 0) {
                    this.screen = 'userFind'
                } else {
                    this.gotoRegister()
                }
            })
        },

        gotoRegister() {
            this.screen = 'register'

            if (isEmail(this.loginUsername)) {
                this.regEmail = this.loginUsername
                this.regUseEmail = true
            } else {
                this.regName = this.loginUsername
                this.regUseEmail = false
            }

            this.regRequireEmail = false
            this.userFindResult.forEach(user => {
                if (user.hasEmail == false) {
                    this.regUseEmail = true
                    this.regRequireEmail = true
                }
            })
        },

        previewAvatar() {
            resizeImg(this.$refs.avatarInput.files[0], 1, 200 * 200).then(i => this.$refs.avatarPreview.src = i)
        },

        register() {
            XHR.post('user/register', {
                avatar: this.$refs.avatarPreview.src.split(';base64,')[1],
                name: this.regName,
                email: this.regUseEmail ? this.regEmail || undefined : undefined,
                password: this.regUseEmail ? this.regPassword || undefined : undefined,
            }).then(r => {
                if (r.code == 1) {
                    XHR.token = r.data
                    setConfig('token', r.data)
                    this.$emit('close')
                    loadUserInfo()
                    FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">注册成功!</span><span class="ui en">Registration successful!</span>' })
                }
            })
        },

        userFindLogin(index) {
            this.loginUser = this.userFindResult.length == 1 ? this.userFindResult[0] : this.userFindResult[index]
            if (this.loginUser.hasEmail || this.loginUser.hasPassword) {
                this.screen = 'emailLogin'
                this.loginEmail = isEmail(this.loginUsername) && this.loginUsername != this.loginUser.name ? this.loginUsername : ''
                this.loginPassword = ''
            } else {
                this.login({ name: this.loginUser.name })
            }
        },

        emailLogin() {
            this.login({
                name: this.loginUser && !this.loginUser.hasEmail ? this.loginUser.name : undefined,
                email: this.loginEmail || undefined,
                password: this.loginPassword || undefined,
            })
        },

        login(payload) {
            XHR.post('user/login', payload).then(r => {
                if (r.code == 1) {
                    XHR.token = r.data
                    setConfig('token', r.data)
                    this.$emit('close')
                    loadUserInfo()
                    FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">登录成功!</span><span class="ui en">Login successful!</span>' })
                }
            })
        },

        gotoForgotPassword() {
            if (this.loginUser && !this.loginUser.hasEmail) {
                FloatMsgs.show({
                    type: 'warn', persist: true, msg: /*html*/`
                            <span class="ui zh">该账号未绑定邮箱, 无法重置密码<br>请联系站长: 3112611479@qq.com</span>
                            <span class="ui en">This account doesn't have an email, for password resets, you must contact: 3112611479@qq.com</span>`
                })
                return
            }
            Popup.show("promptInputPopup", {
                title: '<span class="ui zh">忘记密码</span><span class="ui en">Forgot password</span>',
                subtitle: /*html*/`
                            <span class="ui zh">输入你想要找回密码的邮箱<br>我们将发送一份重置密码的邮件, 然后您可以设置新密码</span>
                            <span class="ui en">Enter the email you wish to recover password.<br>We will then send you a password reset link via email.</span>
                            `,
                text: this.loginEmail,
                action(email) {
                    this.disabled = true
                    XHR.post('user/resetpassword' + obj2queryString({ email })).then(r => {
                        if (r.code == 1) {
                            this.$emit('close')
                            FloatMsgs.show({
                                type: 'success', persist: true, msg: /*html*/`
                                        <span class="ui zh">密码重置邮件已发送! 请检查收件箱</span>
                                        <span class="ui en">A password reset link was sent to your email, check your inbox</span>`
                            })
                        }
                        this.disabled = false
                    }).catch(() => {
                        this.disabled = false
                    })
                }
            })
        },
    },
}
</script>