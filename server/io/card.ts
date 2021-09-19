import { Server, Socket } from 'socket.io';
import {
  convertDomainToPublicData,
  Domain,
  searchDomain,
} from '../../lib/wanda/domain';
import { Component } from '../../lib/wanda/component';
import _ from 'lodash';

const API = {
  version: 1,
  evts: {
    rooms: {
      data: [],
    },
    room: {
      data: {
        playerIdList: [],
      },
    },
    table: {
      data: {},
    },
  },
  methods: {
    joinRoom: {
      msg: { roomName: '' },
    },
    leaveRoom: {
      msg: { roomName: '' },
    },
    reset: {
      msg: { roomName: '' },
    },
    deal: {
      msg: {
        roomName: '',
        from: { domainId: '', componentIndex: 0 },
        to: { domainId: '', componentIndex: 0 },
      },
    },
  },
};
interface Card extends Component {
  type: 'card';
  value: {
    suit: string;
    num: number;
  };
}
interface CardBundle extends Domain {
  components: Card[];
}
interface Table extends Domain {
  children: CardBundle[];
}
interface Player {
  id: string;
}

const tables: {
  [roomName: string]: Table;
} = {};

export default function(socket: Socket, io: Server) {
  const namespace = io.of('/card');
  const { id: playerId } = socket;
  function existsRoom(roomName: string) {
    return namespace.adapter.rooms.has(roomName);
  }
  function getRoomInfo(roomName: string) {
    return existsRoom(roomName)
      ? {
          name: roomName,
          playerIdList: Array.from(namespace.adapter.rooms.get(roomName)!),
        }
      : null;
  }
  function getDefaultRoomName(): string {
    const roomNameSet = namespace.adapter.sids.get(socket.id);
    if (!roomNameSet) {
      throw new Error('Not joined room');
    }
    if (roomNameSet.size > 1) {
      throw new Error('Multiple entered rooms');
    }
    return roomNameSet.values().next().value;
  }
  function syncRooms() {
    const sids = Array.from(namespace.adapter.sids.keys());
    const rooms = Array.from(namespace.adapter.rooms.keys());
    namespace.emit('rooms', {
      data: rooms
        .filter(name => !sids.includes(name) && !!name)
        .map(name => ({
          roomName: name,
        })),
    });
  }
  function syncRoom(roomName: string) {
    const roomInfo = getRoomInfo(roomName);
    console.log('syncRoom', { roomName, playerId, roomInfo });
    namespace.to(roomName).emit('room', { data: roomInfo });
    socket.emit('room', { data: roomInfo });
  }

  function syncTable(roomName: string) {
    const table = tables[roomName];
    console.log('syncTable', { roomName, playerId, table });
    const playerIdList = getRoomInfo(roomName)!.playerIdList;
    playerIdList.forEach(sendPlayerId => {
      const data = convertDomainToPublicData(table, sendPlayerId);
      namespace.sockets.get(sendPlayerId)?.emit('table', {
        data,
      });
    });
  }
  syncRooms();
  const self = Object.freeze({
    getAPI() {
      return API;
    },
    joinRoom({ roomName }: { roomName: string }) {
      console.log('joinRoom', { playerId, roomName });
      socket.once('disconnect', () => {
        syncRoom(roomName);
      });
      socket.join(roomName);
      syncRoom(roomName);
      syncRooms();
      syncTable(roomName);
    },
    leaveRoom({ roomName }: { roomName?: string }) {
      console.log('leaveRoom', { playerId, roomName });
      roomName = roomName || getDefaultRoomName();
      socket.leave(roomName);
      syncRoom(roomName);
    },
    reset({ roomName }: { roomName: string }) {
      roomName = roomName || getDefaultRoomName();
      if (existsRoom(roomName)) {
        console.log('reset', { playerId, roomName });
        const playerIdList = getRoomInfo(roomName)!.playerIdList;
        const deck: CardBundle = {
          id: 'DECK',
          owner: [],
          components: _.shuffle(
            _.range(0, 54).map(index => {
              const suit = index < 52 ? ['s', 'd', 'c', 'h'][index % 4] : 'j';
              const num = index < 52 ? Math.floor(index / 4) + 1 : index - 51;
              const card: Card = {
                id: `CARD-${index}`,
                type: 'card',
                value: { suit, num },
              };
              return card;
            }),
          ),
        };
        const discard: CardBundle = {
          id: 'DISCARD',
          components: [],
        };

        const table: Table = {
          id: 'TABLE',
          children: [
            deck,
            discard,
            ...playerIdList.flatMap(id => {
              const hand: CardBundle = {
                id: 'HAND-' + id,
                code: id,
                owner: [id],
                components: [],
              };
              const open: CardBundle = {
                id: 'OPEN-' + id,
                code: id,
                components: [],
              };
              return [hand, open];
            }),
          ],
        };
        tables[roomName] = table;
        syncTable(roomName);
      }
    },
    deal({
      roomName,
      from,
      to,
    }: {
      roomName: string;
      from: { domainId: string; componentIndex: number };
      to: { domainId: string; componentIndex: number };
    }) {
      roomName = roomName || getDefaultRoomName();
      if (existsRoom(roomName)) {
        console.log('deal', { playerId, roomName, from, to });
        const table = tables[roomName];
        if (table) {
          const toDomain = searchDomain(table, {
            domainId: to.domainId,
          });
          const fromDomain = searchDomain(table, { domainId: from.domainId });
          if (
            !(
              fromDomain &&
              fromDomain.components &&
              toDomain &&
              toDomain.components
            )
          ) {
            return;
          }
          if (!Number.isInteger(from.componentIndex)) {
            from.componentIndex = 0;
          }
          if (!Number.isInteger(to.componentIndex)) {
            to.componentIndex = toDomain.components.length;
          }
          if (
            fromDomain.components.length > from.componentIndex &&
            toDomain.components.length >= to.componentIndex
          ) {
            const pickComponent = fromDomain.components.splice(
              from.componentIndex,
              1,
            )[0];
            toDomain.components.splice(to.componentIndex, 0, pickComponent);
            syncTable(roomName);
          }
        }
      }
    },
  });
  return self;
}
