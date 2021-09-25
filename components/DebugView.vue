<template>
  <div
    v-if="isDebug"
    style="position:absolute;right:0;top:0;height:100%;overflow-y:scroll;background-color:rgba(255,255,255,0.3);color:black"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  computed: {
    isDebug(): boolean {
      console.log('debug');
      return 'debug' in this.$route.query;
    },
  },
});
</script>
