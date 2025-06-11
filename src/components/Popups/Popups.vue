<template>
    <div v-for="(item, index) in popups" class="popupContainer">
        <div class="popupBG" @click="close(index)"></div>
        <div class="popupItem">
            <component :ref="`popup-${index}`" :is="item.component" v-bind="item.props" @close="close(index)"></component>
            <button class="closeBtn" @click="close(index)"></button>
        </div>
    </div>
</template>

<script lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { logErr } from '../..'

interface Popup {
    component: string
    props?: object
}

export default {
    data() {
        return {
            popups: [] as Popup[],
        }
    },

    methods: {
        show(component: string, props?: object) {
            if (component in this.$.appContext.components) {
                this.popups.push({ component, props })
            } else {
                logErr(undefined, `Cannot find a popup named "${component}"`)
            }
        },

        close(index?: number) {
            index != null ? this.popups.splice(index, 1) : this.popups = []
        },

        getAllPopups() {
            const popups = []
            for (const key in this.$refs) {
                const value = this.$refs[key] as ComponentPublicInstance[]
                if (value.length) popups.push(value[0])
            }
            return popups
        },
    },
}
</script>

<style></style>