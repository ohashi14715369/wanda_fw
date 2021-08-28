<template>
  <v-list>
    <v-list-item v-for="(item, i) in items" :key="i" :to="item.to" router exact>
      <v-list-item-action v-if="item.icon">
        <v-icon>{{ item.icon }}</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title v-text="item.title" />
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import Vue from 'vue';
export interface NavigationItem {
  title: string;
  to: string;
  icon?: string;
}
export default Vue.extend({
  props: { items: { type: Array as Vue.PropType<NavigationItem[]> } }
});
</script>
