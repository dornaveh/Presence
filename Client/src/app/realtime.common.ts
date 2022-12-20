export class UpdatedProperty {
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
