<template>
    <div>
        <h2 v-html="title"></h2>
        <div v-html="subtitle" class="inputHelperText"></div>
        <input type="text" v-model="value" @keypress="e => e.key == 'Enter' && value.length > 0 && submit()">
        <button class="okBtn" :disabled="value.length == 0 || disabled" @click="submit()"><span class="ui zh">确定 ✔</span><span class="ui en">OK ✔</span></button>
    </div>
</template>

<script lang="ts">
// @ts-nocheck

export default {
    props: ['title', 'subtitle', 'text', 'action'],

    data: () => ({
        value: '',
        disabled: false,
    }),

    methods: {
        submit() {
            this.submitAction(this.value)
        },

        submitAction(value) {
            console.log(value)
            this.$emit('close')
        },
    },

    mounted() {
        if (this.text) this.value = this.text
        if (this.action) this.submitAction = this.action
    },
}
</script>