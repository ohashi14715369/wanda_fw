<template>
  <div>
    <v-container v-if="isApiReady">
      <v-row>
        <v-col>
          <h1>table</h1>
          <v-row>
            <v-col>
              <h3>deck</h3>
              <div>{{ deckCount }}</div>
              <v-btn @click="draw">draw</v-btn>
              <v-btn @click="reset">reset</v-btn>
            </v-col>
            <v-col @click="() => deal('DISCARD')">
              <h3>discard</h3>
              <selectable-bundle
                v-if="discard"
                v-model="selectedBundle"
                :items="discard.components"
                :bundleName="discard.id"
              >
                <template #item="{value}">
                  <trump :suit="value.value.suit" :num="value.value.num" />
                </template>
              </selectable-bundle>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <h3>players</h3>
          <template v-for="playerId in playerIdList">
            <v-card v-if="playerId in hands" :key="playerId">
              <v-card-title>{{ playerId }}</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col>
                    <h5 @click="() => deal(hands[playerId].id)">in hands</h5>
                    <selectable-bundle
                      v-model="selectedBundle"
                      :items="handIndices(playerId)"
                      :bundleName="hands[playerId].id"
                    >
                      <template #item="{value}">
                        <trump
                          v-if="
                            hands[playerId].components &&
                              hands[playerId].components.length >= value
                          "
                          :suit="hands[playerId].components[value].value.suit"
                          :num="hands[playerId].components[value].value.num"
                        />
                        <trump v-else />
                      </template>
                    </selectable-bundle>
                  </v-col>
                  <v-col>
                    <h5 @click="() => deal(openHands[playerId].id)">
                      open hands
                    </h5>
                    <selectable-bundle
                      v-model="selectedBundle"
                      :items="openHandIndices(playerId)"
                      :bundleName="openHands[playerId].id"
                    >
                      <template #item="{value}">
                        <trump
                          v-if="
                            openHands[playerId].components &&
                              openHands[playerId].components.length >= value
                          "
                          :suit="
                            openHands[playerId].components[value].value.suit
                          "
                          :num="openHands[playerId].components[value].value.num"
                        />
                        <trump v-else />
                      </template>
                    </selectable-bundle>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </template>
        </v-col>
      </v-row>
    </v-container>
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
  mounted() {
    this.connect();
  },
  computed: {
    isApiReady(): boolean {
      return this.ioApi.ready;
    },
    selfPlayerId(): string | null {
      return this.socket ? this.socket.id : null;
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
      return this.ioData.room.playerIdList;
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
.selected {
  color: cyan;
}
.hand {
  position: relative;
  height: 150px;
  padding: 1em;
  .card {
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
