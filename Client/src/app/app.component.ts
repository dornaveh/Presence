import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom } from 'rxjs';
import { Backend, Channel, UpdateMessage } from './backend';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private backend = new Backend(x => { this.onGroupChange(x) });
  private connectRequested = false;

  server = 'https://localhost:7126';
  user = '111';
  temp: UpdateMessage;
  channels: ChannelWrapper[] = [];
  displayedColumns: string[] = ['key', 'user', 'value', 'clear'];
  queryResult = '';
  
  get isConnecting() {
    return !this.backend.isConnected && this.connectRequested;
  }

  get isConnected() {
    return this.backend.isConnected;
  }

  constructor(private snackBar: MatSnackBar, private http: HttpClient) {
    this.temp = new UpdateMessage();
    this.temp.channel = '43111';
  }

  connect() {
    this.connectRequested = true;
    this.backend.connect(this.server + '/presence', () => this.user, () => { this.disconnect() });
  }

  disconnect() {
    this.connectRequested = false;
    this.backend.disconnect();
    this.channels = [];
    this.snackBar.open('Disconnected', undefined, { duration: 5000 });
    setTimeout(() => {
      if (!this.isConnected)
        this.connect()
    }, 5000);
  }

  async subscribe() {
    if (await this.backend.subscribe(this.temp.channel)) {
      this.snackBar.open('Failed to subscibe', undefined, { duration: 5000 });
    }
  }

  unsubscribe(cw: ChannelWrapper) {
    this.backend.unsubscribe(cw.channel.name);
  }

  async send(cw: ChannelWrapper) {
    if (!await this.backend.send(cw.channel.name, cw.key, cw.value)) {
      this.snackBar.open('Failed to update', undefined, { duration: 5000 });
    }
  }

  async query() {
    var x = await lastValueFrom(this.http.get<Channel>(this.server + '/access/getchannels?channel=' + this.temp.channel + '&access_token=' + this.user));
    this.queryResult = JSON.stringify(x, null, 2);
  }

  async updateTemp() {
    var x = await lastValueFrom(this.http.post<boolean>(this.server + '/access/update?access_token=' + this.user, this.temp));
    this.queryResult = JSON.stringify(x, null, 2);
  }

  clear(channel: string, key: string) {
    this.backend.send(channel, key, '');
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
