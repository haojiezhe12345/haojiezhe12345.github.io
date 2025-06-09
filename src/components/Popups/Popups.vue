<template>
    <div v-for="(item, index) in popups" class="popupContainer">
        <div class="popupBG" @click="close(index)"></div>
        <div class="popupItem">
            <component :is="item.component" v-bind="item.props" @close="close(index)"></component>
            <button class="closeBtn" @click="close(index)"></button>
        </div>
    </div>
</template>

<script lang="ts">
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
            this.popups.push({ component, props })
        },

        close(index?: number) {
            index != null ? this.popups.splice(index, 1) : this.popups = []
        },
    },
}
</script>

<style></style>