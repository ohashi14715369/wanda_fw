<template>
  <v-container>
    <v-row v-if="isApiReady">
      <v-col v-for="(args, method) in ioApi.methods" :key="method">
        <v-btn @click="e => ioApi[method](callArgs[method])">{{
          method
        }}</v-btn>
        <div v-if="ioApi.methods[method].msg">
          <v-text-field
            v-for="(value, argName) in ioApi.methods[method].msg"
            v-model="callArgs[method][argName]"
            :key="argName"
            :label="argName"
          />
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>isApiReady:{{ isApiReady }}</v-col>
      <v-col>
        ioApi:
        <pre>{{ JSON.stringify(ioApi, null, 2) }}</pre>
      </v-col>
      <v-col>
        ioData:
        <pre>{{ JSON.stringify(ioData, null, 2) }}</pre>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { NuxtSocket } from 'nuxt-socket-io';
import Vue from 'vue';
export default Vue.extend({
  data(): {
    socket: NuxtSocket | null;
    ioApi: any;
    ioData: any;
    callArgs: any;
  } {
    return { socket: null, ioApi: {}, ioData: {}, callArgs: {} };
  },
  mounted() {
    this.connect();
  },
  computed: {
    isApiReady(): boolean {
      return this.ioApi.ready;
    },
  },
  watch: {
    isApiReady(newValue) {
      if (newValue) {
        this.callArgs = Object.assign(
          {},
          ...Object.keys(this.ioApi.methods)
            .filter(methodName => 'msg' in this.ioApi.methods[methodName])
            .map(methodName => ({
              [methodName]: Object.assign(
                {},
                ...Object.keys(this.ioApi.methods[methodName].msg).map(
                  argName => ({
                    [argName]: null,
                  }),
                ),
              ),
            })),
        );
      }
    },
  },
  methods: {
    connect() {
      this.socket = this.$nuxtSocket({
        channel: '/' + this.$route.params.channel,
        serverAPI: { label: '', version: 1 },
      });
    },
  },
});
</script>
