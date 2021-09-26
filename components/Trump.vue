<template>
  <div :class="{ trump: true, backside: !numStr, redSuit: isRed, selected }">
    <v-icon class="suit" v-if="icon" style="color:inherit">{{ icon }}</v-icon>
    <div class="num">{{ numStr }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  props: {
    suit: String,
    num: Number,
    selected: Boolean,
  },
  computed: {
    icon(): string | null {
      const map: { [key: string]: string } = {
        s: 'mdi-cards-spade',
        c: 'mdi-cards-club',
        d: 'mdi-cards-diamond',
        h: 'mdi-cards-heart',
        j: 'mdi-emoticon-devil',
      };
      return map[this.suit] || null;
    },
    isRed(): boolean {
      return ['d', 'h'].includes(this.suit);
    },
    numStr(): string | null {
      if (this.suit === 'j') {
        return '*';
      }
      const map: { [num: number]: string } = {
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K',
      };
      console.log({ map, num: this.num });
      return Number.isInteger(this.num)
        ? map[this.num] || String(this.num)
        : null;
    },
  },
});
</script>

<style lang="scss">
.trump {
  position: relative;
  border: solid 1px black;
  background-color: white;
  padding: 0.2em;
  color: black;
  border-radius: 5px;
  width: 40px;
  height: 60px;
  &.selected {
    box-shadow: 0 0 5px cyan;
  }
  &.redSuit {
    color: red;
  }
  &.backside {
    background-color: gray;
  }
  .num {
    font-family: monospace;
    width: 24px;
    text-align: center;
  }
}
</style>
