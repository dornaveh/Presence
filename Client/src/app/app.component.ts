import { Component } from '@angular/core';
import { HubConnection } from '@microsoft/signalr/dist/esm/HubConnection';
import { HubConnectionBuilder } from '@microsoft/signalr/dist/esm/HubConnectionBuilder';

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
  private hubConnection: HubConnection | undefined;

  async connect() {
    try {
      if (this.hubConnection) {
        this.hubConnection.stop();
        this.hubConnection = undefined;
      }
      this.hubConnection = new HubConnectionBuilder().withUrl(this.server,
        { accessTokenFactory: () => { return this.user; } }
      ).build();
      this.hubConnection.on('update', (update: PresenceMessage) => {
        console.log(update);
      });
      this.hubConnection.on('echo', x => {
        console.log(x);
      });

      await this.hubConnection.start();
      this.hubConnection.onclose(() => {
        console.log("WebSocket closed");
        setTimeout(() => { this.connect() }, 1000);
      });
    } catch (error) {
      console.error('Could not connect ' + error);
    }
  }

  async echo() {
    await (this.hubConnection as HubConnection).invoke("Echo", "hello");
  }

  async subscribe() {
    var success = await (this.hubConnection as HubConnection).invoke<boolean>("Subscribe", this.channel);
    console.log("subsribe to channel %s was %ssuccessful", this.channel, success ? '' : 'NOT ');
  }

  async message() {
    var m = new PresenceMessage();
    m.channel = this.channel;
    m.key = this.key;
    m.value = this.value;
    var success = await (this.hubConnection as HubConnection).invoke<boolean>("UpdateChannel", m);
    console.log("sent to channel %s was %ssuccessful", this.channel, success ? '' : 'NOT ');
  }


}

class PresenceMessage {
  channel: string = '';
  key: string = '';
  value: string = '';
}


