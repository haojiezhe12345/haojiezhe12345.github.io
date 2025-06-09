<template>
    <div v-for="item in msgs" :key="item.id" :class="[item.type, item.persist ? 'persist' : '']">
        <i v-if="item.type == 'info'">💡</i>
        <i v-if="item.type == 'success'">✅</i>
        <i v-if="item.type == 'warn'">⚠️</i>
        <i v-if="item.type == 'error'">❌</i>
        <span v-html="item.msg"></span>
        <i v-if="item.persist" class="closeBtn" @click="close(item.id!)"></i>
    </div>
</template>

<script lang="ts">
interface Msg {
    id?: number
    type: 'info' | 'success' | 'warn' | 'error'
    msg: string
    persist?: boolean
    timeout?: number
}

export default {
    data() {
        return {
            count: 0,
            msgs: [] as Msg[],
        }
    },

    methods: {
        show(msg: Msg | string) {
            if (typeof msg == 'string') {
                msg = {
                    type: 'info',
                    msg: msg
                }
            }
            msg.id = this.count
            this.count++
            this.msgs.push(msg)
            if (!msg.persist) {
                setTimeout(() => {
                    this.close(msg.id!)
                }, msg.timeout || 4000);
            }
        },

        close(id: number) {
            this.msgs.forEach((item, i) => {
                if (item.id == id) {
                    this.msgs.splice(i, 1)
                    return
                }
            })
        },
    }
}
</script>

<style>
#floatMsgs {
    top: 15%;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    flex-flow: column;
    pointer-events: none;
}

#floatMsgs>div {
    margin: 0 0 0.75rem;
    padding: 0.5rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(0.5rem);
    border-radius: 0.5rem;
    box-sizing: border-box;
    max-width: 80vw;
    display: flex;
    flex-flow: row;
    gap: 0.5rem;
    align-items: center;
    box-shadow: 0 0.125rem 0.5rem 0 rgba(0, 0, 0, 0.5);
    animation: floatMsgFlyin 0.3s;
}

#floatMsgs>div.success {
    background-color: rgba(200, 255, 200, 0.75);
}

#floatMsgs>div.warn {
    background-color: rgba(255, 255, 200, 0.75);
}

#floatMsgs>div.error {
    background-color: rgba(255, 200, 200, 0.75);
}

#floatMsgs>div.persist {
    pointer-events: all;
}

#floatMsgs>div>i {
    user-select: none;
    font-style: normal;
    flex-shrink: 0;
}

#floatMsgs>div>span {
    min-width: 0;
}

#floatMsgs .closeBtn {
    display: block;
    width: 0.825em;
    height: 0.825em;
    line-height: 0.625em;
    font-size: 1.6rem;
    font-family: Arial;
    box-sizing: border-box;
    padding: 0.125em;
    border: none;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 100%;
}

#floatMsgs .closeBtn::after {
    content: "\00D7";
}

#floatMsgs .closeBtn:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

#floatMsgs .closeBtn:active {
    background-color: rgba(0, 0, 0, 0.5);
}

@keyframes floatMsgFlyin {
    from {
        opacity: 0;
        transform: translateY(-50%);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>