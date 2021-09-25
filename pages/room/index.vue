<template>
  <v-container>
    <v-row>
      <v-col>
        <v-form
          ref="registerNameForm"
          @submit.prevent="
            () => $refs.registerNameForm.validate() && registerName()
          "
        >
          <v-text-field
            v-model="inputName"
            label="プレイヤー名登録"
            :rule="[v => !!v || 'required']"
          />
          <v-btn type="submit" :disabled="registeredName == inputName"
            >登録</v-btn
          >
        </v-form>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-form
          ref="createRoomForm"
          @submit.prevent="
            () =>
              $refs.createRoomForm.validate() &&
              $router.push(`/room/${createRoomName}`)
          "
          :readonly="!registeredName"
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
              <v-btn link type="submit">部屋を作る</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table
          :headers="[
            { text: '部屋名', value: 'name' },
            { text: 'プレイヤー', value: 'players' },
            { value: 'actions' },
          ]"
          :items="rooms"
        >
          <template #[`item.players`]="{item}">
            {{ item.players.map(player => player.displayName).join(',') }}
          </template>
          <template #[`item.actions`]="{item}">
            <v-btn
              icon
              v-if="item.players.every(player => !player.online)"
              @click="() => deleteRoom(item.name)"
              ><v-icon>mdi-delete</v-icon></v-btn
            >
            <v-btn icon :disabled="!registeredName" :to="`/room/${item.name}`"
              ><v-icon>mdi-door</v-icon></v-btn
            >
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        {{ JSON.stringify(ioData, null, 2) }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { NuxtSocket } from 'nuxt-socket-io';
import Vue from 'vue';
import { Room } from '~/server/io/card';
export default Vue.extend({
  data(): {
    socket: NuxtSocket | null;
    ioApi: any;
    ioData: any;
    createRoomName: string | null;
    registeredName: string | null;
    inputName: string | null;
  } {
    return {
      socket: null,
      ioApi: {},
      ioData: {},
      createRoomName: null,
      registeredName: null,
      inputName: null,
    };
  },
  mounted() {
    this.connect();
    this.registeredName = localStorage?.registeredName || null;
    this.inputName = this.registeredName;
  },
  computed: {
    isApiReady(): boolean {
      return this.ioApi.ready;
    },
    rooms(): Room[] {
      return this.isApiReady ? this.ioData.rooms.list : [];
    },
  },
  watch: {
    isApiReady(newValue) {
      if (newValue) {
        this.ioApi.getRooms();
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
    registerName() {
      localStorage.registeredName = this.inputName;
      this.registeredName = this.inputName;
    },
    deleteRoom(roomName: string) {
      this.ioApi.deleteRoom({ roomName });
    },
  },
});
</script>
