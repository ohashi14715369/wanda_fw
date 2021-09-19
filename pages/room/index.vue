<template>
  <v-container>
    <v-row>
      <v-col>
        <v-form
          ref="createRoomForm"
          @submit.prevent="
            () =>
              $refs.createRoomForm.validate() &&
              $router.push(`/room/${createRoomName}`)
          "
        >
          <v-row>
            <v-col>
              <v-text-field
                v-model="createRoomName"
                label="部屋名"
                dense
                :rules="[v => !!v || 'required']"
              />
            </v-col>
            <v-col>
              <v-btn link type="submit">CREATE ROOM</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table
          :headers="[{ text: '部屋名', value: 'roomName' }, { value: 'join' }]"
          :items="rooms"
        >
          <template #[`item.join`]="{item}">
            <v-btn link :to="`/room/${item.roomName}`">JOIN</v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { NuxtSocket } from 'nuxt-socket-io';
import Vue from 'vue';
import { DomainData, searchDomainData } from '~/lib/wanda/domain';
export default Vue.extend({
  data(): {
    socket: NuxtSocket | null;
    ioApi: any;
    ioData: any;
    createRoomName: string | null;
  } {
    return {
      socket: null,
      ioApi: {},
      ioData: {},
      createRoomName: null,
    };
  },
  mounted() {
    this.connect();
  },
  computed: {
    isApiReady(): boolean {
      return this.ioApi.ready;
    },
    rooms(): { roomName: string }[] {
      return this.isApiReady ? this.ioData.rooms : [];
    },
  },
  watch: {
    isApiReady(newValue) {
      if (newValue) {
        this.ioApi.joinRoom({ roomName: this.$route.params.roomName });
      }
    },
  },
  methods: {
    connect() {
      this.socket = this.$nuxtSocket({
        channel: '/card',
        serverAPI: { label: '', version: 1 },
      });
    },
  },
});
</script>
