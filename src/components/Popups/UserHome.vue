<template>
    <div class="userHome" @scroll="scroll">
        <div class="userinfo">
            <img :src="convertAvatarPath(user.avatar)" onclick="viewImg(this.src)">
            <div>
                <div>{{ user.name }}</div>
                <div>
                    <span>UID: {{ user.id }}&nbsp;&nbsp;</span>
                    <span>
                        <span class="ui zh">注册时间: </span><span class="ui en">Joined </span>
                        {{ new Date(user.create_time * 1000).toLocaleDateString() }}
                    </span>
                </div>
            </div>
        </div>
        <div class="useraction" v-if="showAction">
            <div>
                <img :src="`${baseUrl}res/edit.svg`"><span class="ui zh">编辑资料</span><span class="ui en">Edit profile</span>
                <ul>
                    <li onclick="User.changeName()"><span class="ui zh">修改昵称</span><span class="ui en">Change nickname</span></li>
                    <li onclick="User.changeAvatar()"><span class="ui zh">修改头像</span><span class="ui en">Change avatar</span></li>
                    <li onclick="User.changeEmail()"><span class="ui zh">修改邮箱</span><span class="ui en">Change email</span></li>
                    <li onclick="User.changePassword()"><span class="ui zh">修改密码</span><span class="ui en">Change password</span></li>
                </ul>
            </div>
            <div>
                <img :src="`${baseUrl}res/logout.svg`"><span class="ui zh">退出登录</span><span class="ui en">Log out</span>
                <ul>
                    <li onclick="User.logout()"><span class="ui zh">退出登录 (当前设备)</span><span class="ui en">Log out (from this device)</span></li>
                    <li onclick="User.resetToken()" style="color: red;"><span class="ui zh">退出登录 (所有设备)</span><span class="ui en">Log out (from all devices)</span></li>
                </ul>
            </div>
        </div>
        <div v-for="(item, index) in comments" :key="item.source + item.id" class="userCommentItem">
            <p>{{ item.timeStr }}<span>#{{ item.id }}</span></p>
            <p>
                <span @click="gotoComment(index)">{{ item.comment }}</span>
                <i></i>
                <img v-for="img in item.image" :src="`${baseUrl}api/data/images/posts/${img}.jpg`" loading="lazy" onclick="viewImg(this.src)">
            </p>
        </div>
        <h4 v-if="toEnd">
            <span class="ui zh">- 共 {{ comments.length }} 条留言 -</span>
            <span class="ui en">- Total {{ comments.length }} messages -</span>
        </h4>
    </div>
</template>

<script lang="ts">
// @ts-nocheck
import { baseUrl, User } from '../..'

export default {
    props: ['id', 'name', 'avatar'],

    data: () => ({
        baseUrl: baseUrl,

        user: {},
        showAction: true,
        comments: [],
        scrollPaused: false,
        toEnd: false,
    }),

    methods: {
        convertAvatarPath: User.convertAvatarPath,

        getUser() {
            XHR.get(this.id ? 'user/find' : 'user/me', {
                id: this.id
            }).then(r => {
                let user = Array.isArray(r) ? r[0] : r
                if (user) {
                    this.user = user
                    this.showAction = this.user.id == User.LoggedOnUserId
                    this.getComments()
                } else {
                    FloatMsgs.show({ type: 'warn', msg: `<span class="ui zh">找不到用户</span><span class="ui en">User not found</span> (ID: ${this.id})` })
                }
            })
        },

        getComments() {
            this.scrollPaused = true

            XHR.get('comments', {
                uid: this.user.id,
                from: this.comments.length,
                count: 50,
            }).then(r => {

                r.forEach(comment => {
                    let time = new Date(comment.time * 1000)
                    comment.timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString()
                    if (typeof comment.image == typeof '' && comment.image) {
                        comment.image = comment.image.split(',')
                    } else {
                        comment.image = []
                    }
                    this.comments.push(comment)
                })

                if (r.length < 10) {
                    this.toEnd = true
                } else {
                    this.scrollPaused = false
                }
            }).catch(() => {
                this.scrollPaused = false
            })
        },

        scroll(e) {
            if (!this.scrollPaused) {
                let toBottom = e.target.scrollHeight - e.target.clientHeight - e.target.scrollTop
                if (toBottom < 100) this.getComments()
            }
        },

        gotoComment(i) {
            clearComments(1);
            loadComments({ from: this.comments[i].id });
            closePopup()
        },
    },

    mounted() {
        this.user = {
            id: this.id,
            name: this.name,
            avatar: this.avatar,
        }
        this.getUser()
    },
}
</script>