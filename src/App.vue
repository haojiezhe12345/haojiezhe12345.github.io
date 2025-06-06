<script setup lang="ts">
import components from './components'

const str = 'Vue 3 loaded'
console.log(str)
components.FloatMsgs.show(str)

</script>

<template>
    {{ str }}
</template>

<style scoped></style>
