<script setup lang="ts">
import FloatMsgs from './components/FloatMsgs'

const str = 'Vue 3 loaded'
console.log(str)
FloatMsgs.show(str)

</script>

<template>
    {{ str }}
</template>

<style scoped></style>
