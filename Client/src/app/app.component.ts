import { Component } from '@angular/core';
import { Backend, Channel } from './backend';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'PresenceClient';
  server = 'https://localhost:7126/presence';
  user = '111';
  channel = '43111';
  channels: ChannelWrapper[] = [];
  displayedColumns: string[] = ['user', 'key', 'value'];

  backend: Backend | undefined = undefined;

  echo() { }
  connect() {
    this.backend = new Backend(x => { this.onGroupChange(x) }, this.server, () => this.user);
    this.backend.connect();
  }

  subscribe() {
    this.backend?.subscribe(this.channel);
  }

  unsubscribe(cw: ChannelWrapper) {
    this.backend?.unsubscribe(cw.channel.name);
  }

  send(cw: ChannelWrapper) {
    this.backend?.send(cw.channel.name, cw.key, cw.value);
  }

  clear(cw: ChannelWrapper) {
    this.backend?.send(cw.channel.name, cw.key, '');
    cw.key = '';
    cw.value = '';
  }

  private onGroupChange(newChannels: Channel[]) {
    this.channels = this.channels.filter(c => newChannels.some(nc => nc.name === c.channel.name));
    newChannels.forEach(nc => {
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

