import { HttpClient } from "@angular/common/http";
import { lastValueFrom } from 'rxjs';
import { Channel, UpdateMessage } from "./realtime.common";

export class RestBackend {

    constructor(private http: HttpClient) { }

    async query(server: string, channel: string, user: string): Promise<string> {
        var x = await lastValueFrom(this.http.get<Channel>(server + '/access/getchannels?channel=' + channel + '&access_token=' + user));
        return JSON.stringify(x, null, 2);
    }

    async update(server: string, user: string, message: UpdateMessage) {
        var x = await lastValueFrom(this.http.post<boolean>(server + '/access/update?access_token=' + user, message));
        return JSON.stringify(x, null, 2);
    }

    async who(server: string): Promise<string> {
        var x = await lastValueFrom(this.http.get<{ id: string }>(server + '/access/who'));
        return x.id;
    }
}