<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" clipped fixed app>
      <v-navigation-list :items="items" />
    </v-navigation-drawer>
    <v-app-bar clipped-left fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title v-text="title" />
      <v-spacer />
      <v-menu>
        <template #activator="{on,attrs}">
          <v-app-bar-nav-icon v-bind="attrs" v-on="on"></v-app-bar-nav-icon>
        </template>
        <v-list>
          <v-list-item>
            <v-checkbox :input="isDebug" label="debug" @change="changeDebug" />
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    <v-main>
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
    <v-footer absolute app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import VNavigationList from '~/components/VNavigationList.vue';
import Vue from 'vue';
export default Vue.extend({
  components: { VNavigationList },
  data() {
    return {
      drawer: false,
      items: [
        {
          icon: 'mdi-apps',
          title: 'room',
          to: '/room',
        },
      ],
      title: 'Wanda Framework',
    };
  },
  computed: {
    isDebug(): boolean {
      return 'debug' in this.$route.query;
    },
  },
  methods: {
    changeDebug() {
      var query = Object.assign({}, this.$route.query);
      if (this.isDebug) {
        delete query['debug'];
      } else {
        query['debug'] = 'true';
      }
      this.$router.push({ query: query });
    },
  },
});
</script>
