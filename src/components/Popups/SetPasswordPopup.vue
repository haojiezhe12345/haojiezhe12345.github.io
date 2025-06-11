<template>
    <div>
        <h2><span class="ui zh">设置新密码</span><span class="ui en">Set new password</span></h2>

        <div v-if="!userHasEmail" class="inputHelperText" style="color: red; font-weight: bold;">
            <span class="ui zh">该账号未绑定邮箱, 设置密码后, 一旦忘记密码将无法找回<br>建议先绑定邮箱再设置密码</span>
            <span class="ui en">This account doesn't have an email, which means you won't be able to reset password if you forget it.<br>It's strongly recommended to link an email before you proceed.</span>
            <br><br>
        </div>

        <div class="inputHelperText"><span class="ui zh">新密码</span><span class="ui en">Enter new password</span></div>
        <input :type="showPassword ? 'text' : 'password'" v-model="password" autocomplete="new-password">

        <div class="inputHelperText"><span class="ui zh">确认密码</span><span class="ui en">Confirm password</span></div>
        <input :type="showPassword ? 'text' : 'password'" v-model="passwordConfirm">

        <label class="setting-switch" style="margin: 0.25rem 0;">
            <span class="ui zh">显示密码</span><span class="ui en">Show password</span>
            <input type="checkbox" v-model="showPassword">
        </label>

        <button class="okBtn" :disabled="password && password != passwordConfirm" @click="submit()"><span class="ui zh">确定 ✔</span><span class="ui en">OK ✔</span></button>
    </div>
</template>

<script lang="ts">
// @ts-nocheck

export default {
    props: ['passwordResetToken'],

    data: () => ({
        password: '',
        passwordConfirm: '',
        showPassword: false,
        userHasEmail: true,
    }),

    methods: {
        submit() {
            if (this.passwordResetToken) {
                XHR.post('action', {
                    id: this.passwordResetToken,
                    data: this.password
                }).then(r => {
                    if (r.code == 1) {
                        this.$emit('close')
                        FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">密码重置成功! 请重新登录</span><span class="ui en">Password reset successfully! Try log in again</span>' })
                        location.hash = ''
                    }
                })
            } else {
                XHR.put('user/update', { password: this.password }).then(r => {
                    if (r.code == 1) {
                        this.$emit('close')
                        FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">密码修改成功</span><span class="ui en">Password updated successfully</span>' })
                    }
                })
            }
        },
    },

    mounted() {
        if (!this.passwordResetToken) {
            User.getMe().then(r => this.userHasEmail = r.hasEmail)
        }
    },
}
</script>