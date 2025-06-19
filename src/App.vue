<script setup lang="ts">
import FloatMsgs from './components/FloatMsgs';

const str = 'Vue 3 loaded'
console.log(str)

FloatMsgs.show({ type: 'warn', msg: `服务器维护中, 预计1小时内恢复<br>预计恢复时间: ${new Date('2025-06-19T15:30:00+08:00').toLocaleString()}`, persist: true })

</script>

<template>
{{ str }}
</template>

<style scoped></style>
