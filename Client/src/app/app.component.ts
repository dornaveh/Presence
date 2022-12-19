import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  displayedColumns: string[] = ['key', 'user', 'value'];

  backend: Backend | undefined = undefined;

  constructor(private snackBar: MatSnackBar) { }

  echo() { }
  connect() {
    this.backend = new Backend(x => { this.onGroupChange(x) }, this.server, () => this.user);
    this.backend.connect();
  }

  async subscribe() {
    var success = false;
    if (this.backend) {
      success = await this.backend.subscribe(this.channel);
    }
    if (!success) {
      this.snackBar.openFromComponent(FailedComponent, {
        duration: 2000,
      });
    }
  }

  unsubscribe(cw: ChannelWrapper) {
    this.backend?.unsubscribe(cw.channel.name);
  }

  async send(cw: ChannelWrapper) {
    var success = false;
    if (this.backend) {
      success = await this.backend.send(cw.channel.name, cw.key, cw.value);
    }
    if (!success) {
      this.snackBar.openFromComponent(FailedComponent, {
        duration: 2000,
      });
    }
  }

  clear(cw: ChannelWrapper) {
    this.backend?.send(cw.channel.name, cw.key, '');
    cw.key = '';
    cw.value = '';
  }

  private onGroupChange(newChannels: Channel[]) {
    this.channels = this.channels.filter(c => newChannels.some(nc => nc.name === c.channel.name));
    newChannels.forEach(nc => {
      nc.properties = nc.properties.sort((a,b)=>{
        var s = a.key.localeCompare(b.key);
        if (s!==0) { return s;}          
        var s = a.user.localeCompare(b.user);
        if (s!==0) { return s;}          
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

@Component({
  template: 'Failed',
})
export class FailedComponent { }

