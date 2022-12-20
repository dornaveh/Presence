using StackExchange.Redis;

namespace CloudPresence;

public class DAL
{
    private readonly IConnectionMultiplexer _redis;
    private const string KeyUserDelimeter = "*$%3*";

    public DAL(IConnectionMultiplexer redis)
    {
        this._redis = redis;
    }

    private RedisValue GetUserKey(string user, string key)
    {
        return new RedisValue(user + KeyUserDelimeter + key);
    }

    public async Task Delete(string channel, string user, string key)
    {
        var db = this._redis.GetDatabase();
        var userKey = GetUserKey(user, key);
        var channelKey = new RedisKey(channel);
        await db.HashDeleteAsync(channelKey, userKey);
    }

    public async Task Put(string channel, string user, string key, string value)
    {
        var db = this._redis.GetDatabase();
        var userKey = GetUserKey(user, key);
        var channelKey = new RedisKey(channel);
        var hash = new HashEntry(userKey, new RedisValue(value));
        await db.HashSetAsync(channelKey, new[] { hash });
    }

    public async Task<Channel> GetChannel(string channel)
    {
        var db = this._redis.GetDatabase();
        var key = new RedisKey(channel);
        var fields = await db.HashGetAllAsync(key);
        return new Channel
        {
            Name = channel,
            Properties = fields.Select(x =>
            {
                var userKey = x.Name.ToString().Split(KeyUserDelimeter);
                return new Property
                {
                    User = userKey[0],
                    Key = userKey[1],
                    Value = x.Value.ToString(),
                };
            }).ToList()
        };
    }
}
