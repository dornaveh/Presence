import { HubConnection } from "@microsoft/signalr";
import { HubConnectionBuilder } from '@microsoft/signalr/dist/esm/HubConnectionBuilder';

export class Backend {

    constructor(
        private onGroupChange: (channels: Channel[]) => void,
        private server: string,
        private accessTokenFactory: () => string) { }

    private hubConnection: HubConnection | undefined;
    private toDisconnect = false;

    private channels: Channel[] = [];

    async connect() {
        if (this.toDisconnect) {
            return;
        }
        try {
            if (this.hubConnection) {
                this.hubConnection.stop();
                this.hubConnection = undefined;
            }
            this.hubConnection = new HubConnectionBuilder().withUrl(this.server,
                { accessTokenFactory: this.accessTokenFactory }
            ).build();

            this.hubConnection.on('update', (update: UpdatedProperty) => {
                console.log(update);
                this.onUpdate(update);
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

    async subscribe(channel: string) : Promise<boolean> {
        var ans = await (this.hubConnection as HubConnection).invoke<Channel>("Subscribe", channel);
        if (ans) {
            this.channels = this.channels.filter(x => x.name !== ans.name);
            this.channels.push(ans);
            this.onGroupChange(this.channels);
            return true;
        } else {
            return false;
        }
    }

    async unsubscribe(channel: string) {
        this.channels = this.channels.filter(x => x.name !== channel);
        await (this.hubConnection as HubConnection).invoke<Channel>("Unsubscribe", channel);
        this.onGroupChange(this.channels);
    }

    async send(channel: string, key: string, value: string) : Promise<boolean> {
        var m = new UpdateMessage();
        m.channel = channel;
        m.key = key;
        m.value = value;
        return await (this.hubConnection as HubConnection).invoke<boolean>("Update", m);
    }
    
    async disconnect() {
        this.toDisconnect = true;
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = undefined;
        }
    }
   
    private onUpdate(update: UpdatedProperty) {
        var channel = this.channels.find(x => x.name === update.channel);
        if (channel) {
            channel.properties = channel.properties.filter(x => x.key !== update.property.key || x.user !== update.property.user);
            if (update.property.value) {
                channel.properties.push(update.property);
            }
            this.onGroupChange(this.channels);
        } else {
            console.log("got update on an unsubscribed channel");
        }
    }
}



class UpdatedProperty {
    channel: string = '';
    property: Property = new Property();
}

export class Property {
    key: string = '';
    user: string = '';
    value: string = '';
}

export class Channel {
    name: string = ''
    properties: Property[] = [];
}

export class UpdateMessage {
    channel: string = '';
    key: string = '';
    value: string = '';
}
