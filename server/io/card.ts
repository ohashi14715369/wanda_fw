import { Server, Socket } from 'socket.io';
import {
  convertDomainToPublicData,
  Domain,
  searchDomain,
} from '../../lib/wanda/domain';
import { Component } from '../../lib/wanda/component';
import _ from 'lodash';
import randomstring from 'randomstring';

const API = {
  version: 1,
  evts: {
    rooms: {
      data: { list: [] },
    },
    room: {
      data: {
        playerIdList: [],
      },
    },
    table: {
      data: {},
    },
    player: {
      data: {},
    },
  },
  methods: {
    getRooms: {},
    deleteRoom: {
      msg: { roomName: '' },
    },
    joinPlayer: {
      msg: { displayName: '', accessToken: '' },
    },
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
export interface Table extends Domain {
  children: CardBundle[];
}

interface Player {
  playerId: string;
  displayName: string;
  accessToken: string;
  socketId: string | null;
}

export interface PlayerInfo {
  playerId: string;
  displayName: string;
  online: boolean;
}

export interface Room {
  name: string;
  players: PlayerInfo[];
}

const players: Player[] = [];
const rooms: Room[] = [];
const tables: {
  [roomName: string]: Table;
} = {};
console.log('initialized card');

export default function(socket: Socket, io: Server) {
  const namespace = io.of('/card');
  const { id: socketId } = socket;
  function getOrGenerateRoom(roomName: string): Room {
    const find = getRoomInfo(roomName);
    const room = find || {
      name: roomName,
      players: [],
    };
    if (!find) {
      rooms.push(room);
    }
    return room;
  }
  function getRoomInfo(roomName: string): Room | null {
    return rooms.find(room => room.name === roomName) || null;
  }
  function syncRooms() {
    console.log('syncRooms');
    console.dir(rooms, { depth: null });
    namespace.emit('rooms', {
      data: { list: rooms },
    });
  }
  function sendToRoom(roomName: string, eventName: string, data: any) {
    const room = getRoomInfo(roomName);
    room?.players.forEach(player => {
      const playerSocketId = players.find(
        item => item.playerId === player.playerId,
      )?.socketId;
      if (playerSocketId) {
        namespace.to(playerSocketId).emit(eventName, { data });
      }
    });
  }
  function syncRoom(roomName: string) {
    const roomInfo = getRoomInfo(roomName);
    console.log('syncRoom', { roomName, socketId, roomInfo });
    sendToRoom(roomName, 'room', roomInfo);
  }
  function syncTable(roomName: string) {
    const table = tables[roomName] || null;
    console.log('syncTable', { roomName, socketId, table });
    getRoomInfo(roomName)?.players.forEach(player => {
      const playerSocketId = players.find(
        item => item.playerId === player.playerId,
      )?.socketId;
      if (playerSocketId) {
        const data = convertDomainToPublicData(table, player.playerId);
        namespace.to(playerSocketId).emit('table', {
          data,
        });
      }
    });
  }
  function leaveRoom({ roomName }: { roomName: string }) {
    const player = getCurrentPlayer();
    const room = getRoomInfo(roomName);
    console.log('leaveRoom', { player, room });
    if (player && room) {
      room.players.splice(
        room.players.findIndex(item => item.playerId === player.playerId),
        1,
      );
      syncRoom(roomName);
    }
    socket.leave(roomName);
  }
  function leavePlayer() {
    const player = players.find(player => player.socketId === socketId);
    console.log('leavePlayer', { socketId, player });
    if (player) {
      player.socketId = null;
      rooms.forEach(room => {
        const playerInfo = room.players.find(
          item => item.playerId === player.playerId,
        );
        if (playerInfo) {
          playerInfo.online = false;
          syncRoom(room.name);
        }
      });
      syncRooms();
    }
  }
  function getCurrentPlayer() {
    return players.find(player => player.socketId === socketId);
  }
  socket.once('disconnect', () => {
    leavePlayer();
  });
  const self = Object.freeze({
    getAPI() {
      return API;
    },
    getRooms() {
      syncRooms();
    },
    deleteRoom({ roomName }: { roomName: string }) {
      const room = getRoomInfo(roomName);
      if (room && room.players.every(player => !player.online)) {
        console.log('deleteRoom', { room });
        rooms.splice(
          rooms.findIndex(item => item.name === room.name),
          1,
        );
        delete tables[room.name];
        syncRooms();
      }
    },
    joinPlayer({
      displayName,
      accessToken,
    }: {
      displayName: string;
      accessToken: string;
    }) {
      console.log('joinPlayer', { displayName, accessToken });
      let player = players.find(player => player.accessToken === accessToken);
      if (!player) {
        player = {
          playerId: randomstring.generate(),
          displayName,
          accessToken,
          socketId,
        };
        players.push(player);
      } else {
        player.socketId = socketId;
        player.displayName = displayName;
      }
      socket.emit('player', {
        data: { playerId: player.playerId, displayName: player.displayName },
      });
    },
    leavePlayer,
    joinRoom({ roomName }: { roomName: string }) {
      const player = getCurrentPlayer();
      if (!player) {
        throw new Error('Not joined player');
      }
      console.log('joinRoom', { player, roomName });
      socket.join(roomName);
      const roomInfo = getOrGenerateRoom(roomName);
      const playerInfo = roomInfo.players.find(
        playerInfo => playerInfo.playerId === player.playerId,
      );
      if (!playerInfo) {
        roomInfo.players.push({
          playerId: player.playerId,
          displayName: player.displayName,
          online: true,
        });
      } else {
        playerInfo.displayName = player.displayName;
        playerInfo.online = true;
      }
      syncRoom(roomName);
      syncRooms();
      syncTable(roomName);
    },
    leaveRoom,
    reset({ roomName }: { roomName: string }) {
      const player = getCurrentPlayer();
      const room = getRoomInfo(roomName);
      if (room && player) {
        console.log('reset', { player, roomName });
        const playerIdList = room.players.map(player => player.playerId);
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
      const player = getCurrentPlayer();
      const room = getRoomInfo(roomName);
      if (room && player) {
        console.log('deal', { player, roomName, from, to });
        const table = tables[roomName];
        if (table) {
          const toDomain = searchDomain(table, {
            domainId: to.domainId,
          });
          const fromDomain = searchDomain(table, { domainId: from.domainId });
          console.log({ fromDomain, toDomain });
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
