<template>
  <v-row>
    <v-col>
      <v-btn @click="click">click</v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { NuxtSocket } from 'nuxt-socket-io';
import Vue from 'vue';
export default Vue.extend({
  data(): { socket: NuxtSocket | null } {
    return { socket: null };
  },
  mounted() {
    this.connect();
  },
  methods: {
    connect() {
      const socket = this.$nuxtSocket({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });
      socket.on('connect', () => {
        console.log('client onConnect');
      });
      socket.on('disconnect', () => {
        console.log('client onDisconnect');
        setTimeout(this.connect, 500);
      });
      socket.on('connect_error', () => {
        console.log('client onConnectError');
      });
      /* Listen for events: */
      socket.on('echo-response', (msg, cb) => {
        console.log('echo-response', { msg, cb });
      });
      this.socket = socket;
    },
    click() {
      this.socket!.emit(
        'echo',
        {
          hello: 'world',
        },
        (...resp: any) => {
          console.log(resp);
        },
      );
    },
  },
});
</script>
