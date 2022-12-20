import { HubConnection } from "@microsoft/signalr";
import { HubConnectionBuilder } from '@microsoft/signalr/dist/esm/HubConnectionBuilder';
import { Channel, UpdatedProperty, UpdateMessage } from "./realtime.common";

export class RealTimeBackend {

    constructor(private onGroupChange: (channels: Channel[]) => void) { }

    private hubConnection: HubConnection | undefined;

    private channels: Channel[] = [];

    isConnected = false;

    async connect(server: string,
        accessTokenFactory: () => string,
        onDisconnect: () => void) {
        try {
            if (this.hubConnection) {
                this.hubConnection.stop();
                this.hubConnection = undefined;
            }
            this.hubConnection = new HubConnectionBuilder().withUrl(server + '/presence',
                { accessTokenFactory: accessTokenFactory }
            ).build();

            this.hubConnection.on('update', (update: UpdatedProperty) => {
                console.log(update);
                this.onUpdate(update);
            });

            await this.hubConnection.start();
            this.isConnected = true;

            var names = this.channels.map(c => c.name);
            for (let index = 0; index < names.length; index++) {
                await this.subscribe(names[index]);
            }

            this.hubConnection.onclose(() => {
                console.log("WebSocket closed");
                if (this.hubConnection) {
                    this.hubConnection.stop();
                    this.hubConnection = undefined;
                    this.isConnected = false;
                    onDisconnect();
                }
            });
        } catch (error) {
            console.error('Could not connect ' + error);
            onDisconnect();
        }
    }

    async subscribe(channel: string): Promise<boolean> {
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

    async send(channel: string, key: string, value: string): Promise<boolean> {
        var m = new UpdateMessage();
        m.channel = channel;
        m.key = key;
        m.value = value;
        return await (this.hubConnection as HubConnection).invoke<boolean>("Update", m);
    }

    disconnect() {
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = undefined;
            this.isConnected = false;
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
            console.error("got update on an unsubscribed channel");
        }
    }
}