<template>
  <div v-if="isApiReady">
    <v-row class="pt-0">
      <v-col>
        <v-row>
          <v-col>
            <h3>デッキ</h3>
          </v-col>
          <v-col cols="auto">
            <v-btn icon @click="reset"><v-icon>mdi-restart</v-icon></v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col> {{ deckCount }}枚 </v-col>
          <v-col cols="auto">
            <v-btn @click="draw">ドロー</v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col @click="() => deal('DISCARD')">
        <h3>捨て札</h3>
        <selectable-bundle
          v-if="discard"
          v-model="selectedBundle"
          :items="discard.components"
          :bundleName="discard.id"
        >
          <template #item="{value, selected}">
            <trump
              :suit="value.value.suit"
              :num="value.value.num"
              :selected="selected"
            />
          </template>
        </selectable-bundle>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="pa-0">
        <template v-for="playerId in playerIdList">
          <v-card :key="playerId" rounded outlined>
            <v-card-text class="pa-2">
              <v-row dense>
                <v-col cols="auto">
                  <v-icon
                    :class="{
                      account: true,
                      online: getPlayer(playerId).online,
                    }"
                    >mdi-account</v-icon
                  >
                </v-col>
                <v-col>
                  {{ getPlayer(playerId).displayName }}
                </v-col>
              </v-row>
              <v-row dense v-if="playerId in hands">
                <v-col cols="8">
                  <h5 @click="() => deal(hands[playerId].id)">手札</h5>
                  <selectable-bundle
                    v-model="selectedBundle"
                    :items="handIndices(playerId)"
                    :bundleName="hands[playerId].id"
                  >
                    <template #item="{value,selected}">
                      <trump
                        v-if="
                          hands[playerId].components &&
                            hands[playerId].components.length >= value
                        "
                        :suit="hands[playerId].components[value].value.suit"
                        :num="hands[playerId].components[value].value.num"
                        :selected="selected"
                      />
                      <trump v-else :selected="selected" />
                    </template>
                  </selectable-bundle>
                </v-col>
                <v-col>
                  <h5 @click="() => deal(openHands[playerId].id)">
                    公開
                  </h5>
                  <selectable-bundle
                    v-model="selectedBundle"
                    :items="openHandIndices(playerId)"
                    :bundleName="openHands[playerId].id"
                  >
                    <template #item="{value, selected}">
                      <trump
                        v-if="
                          openHands[playerId].components &&
                            openHands[playerId].components.length >= value
                        "
                        :suit="openHands[playerId].components[value].value.suit"
                        :num="openHands[playerId].components[value].value.num"
                        :selected="selected"
                      />
                      <trump v-else :selected="selected" />
                    </template>
                  </selectable-bundle>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </template>
      </v-col>
    </v-row>
    <debug-view>
      <pre>{{ JSON.stringify({ player, room, table }, null, 2) }}</pre>
    </debug-view>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { NuxtSocket } from 'nuxt-socket-io';
import Vue from 'vue';
import SelectableBundle, {
  SelectedBundle,
} from '~/components/SelectableBundle.vue';
import { DomainData, searchDomainData } from '~/lib/wanda/domain';
import randomstring from 'randomstring';
import { PlayerInfo, Room, Table } from '~/server/io/card';
export default Vue.extend({
  components: { SelectableBundle },
  data(): {
    socket: NuxtSocket | null;
    ioApi: any;
    ioData: any;
    selectedBundle: SelectedBundle;
  } {
    return {
      socket: null,
      ioApi: {},
      ioData: {},
      selectedBundle: {
        bundleName: null,
        indices: [],
      },
    };
  },
  asyncData({ app }) {
    if (!app.$cookies.get('accessToken')) {
      app.$cookies.set('accessToken', randomstring.generate());
    }
  },
  mounted() {
    this.connect();
  },
  computed: {
    isApiReady(): boolean {
      return this.ioApi.ready;
    },
    isPlayerReady(): boolean {
      return !!this.ioData.player?.playerId;
    },
    player(): PlayerInfo {
      return this.ioData.player;
    },
    room(): Room {
      return this.ioData.room;
    },
    table(): Table {
      return this.ioData.table;
    },
    players(): PlayerInfo[] {
      return this.ioData.room.players;
    },
    selfPlayerId(): string | null {
      return this.player ? this.player.playerId : null;
    },
    roomName(): string {
      return this.$route.params.roomName;
    },
    deckCount(): number | string {
      if (!this.isApiReady) {
        return '-';
      }
      const deck = searchDomainData(this.ioData.table, { domainId: 'DECK' });
      return deck ? deck.componentsCount! : '-';
    },
    playerIdList(): string[] {
      if (!this.isApiReady) {
        return [];
      }
      return this.ioData.room.players?.map((player: any) => player.playerId);
    },
    hands(): { [playerId: string]: DomainData } {
      const hands = this.playerIdList
        .map(playerId =>
          searchDomainData(this.ioData.table, {
            domainId: 'HAND-' + playerId,
          }),
        )
        .reduce((prev, data) => {
          if (data) {
            prev[data.code!] = data;
          }
          return prev;
        }, {} as { [playerId: string]: DomainData });
      return hands;
    },
    openHands(): { [playerId: string]: DomainData } {
      const hands = this.playerIdList
        .map(playerId =>
          searchDomainData(this.ioData.table, {
            domainId: 'OPEN-' + playerId,
          }),
        )
        .reduce((prev, data) => {
          if (data) {
            prev[data.code!] = data;
          }
          return prev;
        }, {} as { [playerId: string]: DomainData });
      return hands;
    },
    discard(): DomainData | null {
      console.log({ table: this.ioData.table });
      return (
        searchDomainData(this.ioData.table, { domainId: 'DISCARD' }) || null
      );
    },
  },
  watch: {
    isApiReady(newValue) {
      if (newValue) {
        this.ioApi.joinPlayer({
          displayName: localStorage.getItem('registeredName'),
          accessToken: this.$cookies.get('accessToken'),
        });
      }
    },
    isPlayerReady(newValue) {
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
    getPlayer(playerId: string): PlayerInfo | null {
      return this.players.find(item => item.playerId === playerId) || null;
    },
    reset() {
      this.ioApi.reset({ roomName: this.$route.params.roomName });
    },
    draw() {
      this.ioApi.deal({
        roomName: this.$route.params.roomName,
        from: { domainId: 'DECK' },
        to: { domainId: 'HAND-' + this.selfPlayerId },
      });
    },
    deal(toDomain: string) {
      this.selectedBundle.indices
        .sort((a, b) => b - a)
        .forEach(index => {
          this.ioApi.deal({
            roomName: this.roomName,
            from: {
              domainId: this.selectedBundle.bundleName,
              componentIndex: index,
            },
            to: { domainId: toDomain },
          });
        });
      this.selectedBundle.bundleName = null;
      this.selectedBundle.indices.splice(0, this.selectedBundle.indices.length);
    },
    handIndices(playerId: string) {
      return _.range(0, this.hands[playerId].componentsCount);
    },
    openHandIndices(playerId: string) {
      return _.range(0, this.openHands[playerId].componentsCount);
    },
  },
});
</script>

<style lang="scss">
.hand {
  position: relative;
  height: 150px;
  padding: 1em;
}
.account {
  color: limegreen !important;
  &:not(.online) {
    color: red !important;
  }
}
</style>
