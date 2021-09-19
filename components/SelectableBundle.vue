<template>
  <div class="selectable-bundle">
    <div
      v-for="(value, index) in items"
      :key="index"
      :class="{
        selected: selected(index),
        bundleItem: true,
      }"
      @click="() => select(index)"
    >
      <slot
        name="item"
        v-bind:value="value"
        v-bind:selected="selected(index)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export interface SelectedBundle {
  bundleName: string | null;
  indices: number[];
}
export default Vue.extend({
  props: { value: Object, items: Array, bundleName: String },
  data(): {
    internalValue: SelectedBundle;
  } {
    return {
      internalValue: this.value || {
        bundleName: null,
        indices: [],
      },
    };
  },
  methods: {
    select(index: number) {
      if (this.internalValue.bundleName !== this.bundleName) {
        this.internalValue.indices.splice(0, this.internalValue.indices.length);
        this.internalValue.bundleName = this.bundleName;
      }
      const findIndex = this.internalValue.indices.findIndex(
        item => item === index,
      );
      if (findIndex !== -1) {
        this.internalValue.indices.splice(findIndex, 1);
      } else {
        this.internalValue.indices.push(index);
      }
      this.$emit('input', this.internalValue);
    },
    selected(index: number) {
      return (
        this.bundleName === this.internalValue.bundleName &&
        this.internalValue.indices.includes(index)
      );
    },
  },
});
</script>

<style lang="scss">
.selectable-bundle {
  position: relative;
  height: 150px;
  padding: 1em;
  .bundleItem {
    position: absolute;
    bottom: 0;
    @for $i from 0 to 100 {
      &:nth-child(#{$i}) {
        left: calc(30px * #{$i});
      }
    }
    &.selected {
      bottom: 1em;
      box-shadow: 0px 0px 10px red;
    }
  }
}
</style>
