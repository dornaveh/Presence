import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RealTimeBackend } from './realtime.backend';
import { Channel, UpdateMessage } from './realtime.common';
import { RestBackend } from './rest.backend';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private readonly realtime = new RealTimeBackend(x => { this.onGroupChange(x) });
  private readonly rest;
  private connectRequested = false;

  server = 'https://localhost:7126';
  user = '111';
  temp: UpdateMessage;
  channels: ChannelWrapper[] = [];
  displayedColumns: string[] = ['key', 'user', 'value', 'clear'];
  queryResult = '';

  get isConnecting() {
    return !this.realtime.isConnected && this.connectRequested;
  }

  get isConnected() {
    return this.realtime.isConnected;
  }

  constructor(private snackBar: MatSnackBar, http: HttpClient) {
    this.temp = new UpdateMessage();
    this.temp.channel = '43111';
    this.rest = new RestBackend(http);
  }

  async connect() {
    this.connectRequested = true;
    await this.realtime.connect(this.server, () => this.user, () => { this.onDisconnected() });
    this.connectRequested = false;
  }

  disconnect() {
    this.realtime.disconnect();
    this.channels = [];
  }

  private onDisconnected() {
    this.disconnect();
    this.snackBar.open('Disconnected', undefined, { duration: 5000 });
    setTimeout(() => {
      if (!this.isConnected)
        this.connect()
    }, 5000);
  }

  async subscribe() {
    if (!await this.realtime.subscribe(this.temp.channel)) {
      this.snackBar.open('Failed to subscibe', undefined, { duration: 5000 });
    }
  }

  unsubscribe(cw: ChannelWrapper) {
    this.realtime.unsubscribe(cw.channel.name);
  }

  async send(cw: ChannelWrapper) {
    if (!await this.realtime.send(cw.channel.name, cw.key, cw.value)) {
      this.snackBar.open('Failed to update', undefined, { duration: 5000 });
    }
  }

  clear(channel: string, key: string) {
    this.realtime.send(channel, key, '');
  }

  async query() {
    this.queryResult = await this.rest.query(this.server, this.temp.channel, this.user);
  }

  async updateTemp() {
    this.queryResult = await this.rest.update(this.server, this.user, this.temp);
  }

  private onGroupChange(newChannels: Channel[]) {
    this.channels = this.channels.filter(c => newChannels.some(nc => nc.name === c.channel.name));
    newChannels.forEach(nc => {
      nc.properties = nc.properties.sort((a, b) => {
        var s = a.key.localeCompare(b.key);
        if (s !== 0) { return s; }
        var s = a.user.localeCompare(b.user);
        if (s !== 0) { return s; }
        return a.value.localeCompare(b.value);
      });
      var cur = this.channels.find(c => c.channel.name === nc.name);
      if (cur) {
        cur.channel = nc;
      } else {
        this.channels.push(new ChannelWrapper(nc, cw => { this.send(cw) }));
      }
    })
  }
}

class ChannelWrapper {
  private _value: string = '';
  constructor(public channel: Channel, private update: (cw: ChannelWrapper) => void) { }
  key: string = '';
  get value() { return this._value }
  set value(v: string) {
    this._value = v;
    if (v && v !== '') {
      this.update(this);
    }
  }
}
