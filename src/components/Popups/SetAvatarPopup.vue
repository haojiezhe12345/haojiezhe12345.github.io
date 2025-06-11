<template>
    <div class="setAvatarPopup">
        <h2><span class="ui zh">设置头像</span><span class="ui en">Set avatar</span></h2>
        <img ref="preview" class="setAvatarImg" onclick="viewImg(this.src)">
        <input ref="input" type="file" accept="image/*" @change="previewAvatar()" />
        <br>
        <button class="okBtn" @click="uploadAvatar()"><span class="ui zh">确定 ✔</span><span class="ui en">OK ✔</span></button>
    </div>
</template>

<script lang="ts">
// @ts-nocheck

export default {
    methods: {
        previewAvatar() {
            resizeImg(this.$refs.input.files[0], 1, 200 * 200).then(i => this.$refs.preview.src = i)
        },

        uploadAvatar() {
            let avatar = this.$refs.preview.src.split(';base64,')[1]
            if (avatar) {
                XHR.put('user/update', { avatar }).then(r => {
                    if (r.code == 1) {
                        this.$emit('close')
                        FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">上传成功</span><span class="ui en">Uploaded successfully</span>' })
                        loadUserInfo()
                    }
                })
            } else {
                this.$emit('close')
            }
        },
    },

    mounted() {
        User.getMe().then(r => this.$refs.preview.src = User.convertAvatarPath(r.avatar))
    },
}
</script>