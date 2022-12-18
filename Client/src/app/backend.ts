import { HubConnection } from "@microsoft/signalr";
import { HubConnectionBuilder } from '@microsoft/signalr/dist/esm/HubConnectionBuilder';

export class Backend {

    constructor(
        private onGroupChange: (channel: Channel) => void,
        private server: string,
        private accessTokenFactory: () => string) { }

    private hubConnection: HubConnection | undefined;

    private channels: Channel[] = [];

    async connect() {
        try {
            if (this.hubConnection) {
                this.hubConnection.stop();
                this.hubConnection = undefined;
            }
            this.hubConnection = new HubConnectionBuilder().withUrl(this.server,
                { accessTokenFactory: this.accessTokenFactory }
            ).build();

            this.hubConnection.on('update', (update: UpdatedProperty) => {
                this.onUpdate(update);
            });

            this.hubConnection.on('echo', x => {
                console.log(x);
            });

            await this.hubConnection.start();
            this.hubConnection.onclose(() => {
                console.log("WebSocket closed");
                setTimeout(() => { this.connect(); }, 5000);
            });

        } catch (error) {
            console.error('Could not connect ' + error);
        }
    }

    async echo() {
        await (this.hubConnection as HubConnection).invoke("Echo", "hello");
    }

    async subscribe(channel: string) {
        var ans = await (this.hubConnection as HubConnection).invoke<Channel>("Subscribe", channel);
        if (ans) {
            this.channels = this.channels.filter(x => x.name !== ans.name);
            this.channels.push(ans);
            this.onGroupChange(ans);
        }
    }

    async unsubscribe(channel: string) {
        this.channels = this.channels.filter(x => x.name !== channel);
        await (this.hubConnection as HubConnection).invoke<Channel>("Unsubscribe", channel);
    }

    async send(channel: string, key: string, value: string) {
        var m = new UpdateMessage();
        m.channel = channel;
        m.key = key;
        m.value = value;
        var success = await (this.hubConnection as HubConnection).invoke<boolean>("Update", m);
        console.log("sent to channel %s was %ssuccessful", channel, success ? '' : 'NOT ');
    }

    private onUpdate(update: UpdatedProperty) {
        var channel = this.channels.find(x => x.name === update.channel);
        if (channel) {
            channel.properties = channel.properties.filter(x => x.key !== update.property.key || x.user !== update.property.user);
            if (update.property.value) {
                channel.properties.push(update.property);
            }
            this.onGroupChange(channel);
        } else {
            console.log("got update on an unsubscribed channel");
        }
    }
}

class UpdateMessage {
    channel: string = '';
    key: string = '';
    value: string = '';
}

class UpdatedProperty {
    channel: string = '';
    property: Property = new Property();
}

class Property {
    key: string = '';
    user: string = '';
    value: string = '';
}

export class Channel {
    name: string = ''
    properties: Property[] = [];
}
