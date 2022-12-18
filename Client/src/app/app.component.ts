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
  key = 'aaa';
  value = 'bbb';

  private backend: Backend | undefined = undefined;

  echo() { }
  connect() {
    this.backend = new Backend(this.onGroupChange, this.server, () => this.user);
    this.backend.connect();
  }

  subscribe() {
    this.backend?.subscribe(this.channel);
  }

  unsubscribe() {
    this.backend?.unsubscribe(this.channel);
  }

  send() {
    this.backend?.send(this.channel, this.key, this.value);
  }

  private onGroupChange(channel: Channel) {
    console.log(channel);
  }
}

