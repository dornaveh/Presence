using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using System.Collections.Specialized;
using System.Web;

public class PresenceHub : Hub
{
    private readonly IConnectionMultiplexer _redis;

    public PresenceHub(IConnectionMultiplexer redis)
    {
        this._redis = redis;
    }

    private string User
    {
        get
        {
            var qs = this.Context?.GetHttpContext()?.Request.QueryString.ToString() ?? "";
            NameValueCollection query = HttpUtility.ParseQueryString(qs);
            return query["access_token"] ?? "NOUSER";
        }
    }

    private RedisValue GetKeyUser(string key)
    {
        return new RedisValue(User + "***" + key);
    }

    private bool CanAccess(string channel)
    {
        return channel.Contains(User);
    }

    public async Task Echo(string message)
    {
        await Clients.Client(Context.ConnectionId).SendAsync("echo", "Echo from server");
    }

    public async Task<bool> Update(UpdateMessage message)
    {
        if (CanAccess(message.Channel))
        {
            var db = this._redis.GetDatabase();
            var channelKey = new RedisKey(message.Channel);
            var key = GetKeyUser(message.Key);
            if (string.IsNullOrEmpty(message.Value))
            {
                await db.HashDeleteAsync(channelKey, key);
            }
            else
            {
                var hash = new HashEntry(key, new RedisValue(message.Value));
                await db.HashSetAsync(channelKey, new[] { hash });
            }
            var toSend = new UpdatedProperty
            {
                Channel = message.Channel,
                property = new Property
                {
                    Key = message.Key,
                    Value = message.Value,
                    User = User
                }
            };
            await Clients.Groups(message.Channel).SendCoreAsync("update", new[] { toSend });
            return true;
        }
        return false;
    }

    public async Task Unsubscribe(string channel)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);
    }

    public async Task<Channel> Subscribe(string channel)
    {
        if (CanAccess(channel))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channel);
            var db = this._redis.GetDatabase();
            var key = new RedisKey(channel);
            var fields = await db.HashGetAllAsync(key);
            return new Channel
            {
                Name = channel,
                Properties = fields.Select(x => {
                    var userKey = x.Name.ToString().Split("***");
                    return new Property
                    {
                        User = userKey[0],
                        Key = userKey[1],
                        Value = x.Value.ToString(),
                    };
                }).ToList()
            };
        }
        return null;
    }

    public class UpdateMessage
    {
        public string Channel { get; set; } = "";
        public string Key { get; set; } = "";
        public string Value { get; set; } = "";
    }

    class UpdatedProperty
    {
        public string Channel { get; set; } = "";
        public Property property { get; set; } = new Property();
    }

    public class Property
    {
        public string Key { get; set; } = "";
        public string User { get; set; } = "";
        public string Value { get; set; } = "";
    }

    public class Channel
    {
        public string Name { get; set; } = "";
        public List<Property> Properties { get; set; } = new List<Property>();
    }
}