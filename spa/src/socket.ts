import * as SocketIO from "socket.io-client";

import { debugMsg } from '@/helpers';

class SocketManager {
  private socket: SocketIO.Socket;

  constructor() {}

  /**
   * Determines if the socket is currently connected.
   * @return `true` if a socket exists and it's connected, `false` otherwise
   */
  public get connected(): boolean {
    if (!this.socket) return false;
    return this.socket.connected;
  }

  /**
   * Emits the given event on the socket, if it exists.
   * @param event name of event to emit
   * @param args 0-N items to send with the event
   * @returns socket instace
   */
  public emit(event: string, ...args: any[]): SocketIO.Socket {
    if (!this.socket) return;
    return this.socket.emit(event, ...args);
  }

  /**
   * Joins the room with the given room id.
   * @param roomId id of room to join
   * @param userToken user's unique token
   * @returns promise to be resolved on join
   */
  public joinRoom(roomId: string, userToken: string): Promise<void> {
    return new Promise(resolve => {
      this.socket.emit("JOIN", {
        room: roomId,
        token: userToken
      });
      resolve();
    })
  }

  /**
   * Tells the server to unsubscribe the socket from the room with the given id.
   * @param roomId id of room to leave
   */
  public leaveRoom(roomId: string): void {
    this.socket.emit("unsubscribe", { room: roomId });
  }

  /**
   * Registers an event handler on the socket.
   * @param event name of event
   * @param callback function to be called when event occurs
   * @returns socket instance
   */
  public on(event: string, callback: (...args: any[]) => void): SocketIO.Socket {
    return this.socket.on(event, callback);
  }

  /**
   * Creates and connects a socket instance.
   * @returns promise to be resolved on connection
   */
  public start(): Promise<void> {
    if (this.socket) return;
    debugMsg("starting socket...");
    this.socket = SocketIO.io();
    this.socket.on("connect", () => this.onConnect());
    this.socket.on("disconnect", () => this.onDisconnect());
    this.socket.on("reconnect", () => this.onReconnect());
    return new Promise(resolve => this.socket.on("connect", resolve));
  }

  /** Connection event handler */
  private onConnect(): void {
    debugMsg('connect');
  }

  /** Disconnection event handler */
  private onDisconnect(): void {
    debugMsg('disconnected...');
  }

  /** Reconnection event handler */
  private onReconnect(): void {
    debugMsg('reconnecting..');
  }
}
export { SocketManager };
const socket = new SocketManager();
export default socket;
