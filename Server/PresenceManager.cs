using Microsoft.AspNetCore.SignalR;

namespace CloudPresence;

public class PresenceManager
{
    private DAL Dal { get; }
    private AccessChecker Access { get; }
    private IHubContext<PresenceHub> Hub { get; }

    public PresenceManager(DAL dal, AccessChecker access, IHubContext<PresenceHub> hub)
    {
        this.Dal = dal;
        this.Access = access;
        this.Hub = hub;
    }

    internal async Task<bool> Update(UpdateMessage message, HttpRequest? req)
    {
        if (string.IsNullOrWhiteSpace(message.Key) || req == null)
        {
            return false;
        }
        if (await Access.CanAccess(req, message.Channel))
        {
            var userid = Access.GetUserId(req);
            if (string.IsNullOrEmpty(message.Value))
            {
                await Dal.Delete(message.Channel, userid, message.Key);
            }
            else
            {
                await Dal.Put(message.Channel, userid, message.Key, message.Value);
            }
            var update = new UpdatedProperty
            {
                Channel = message.Channel,
                Property = new Property
                {
                    Key = message.Key,
                    Value = message.Value,
                    User = userid
                }
            };
            await Hub.Clients.Groups(update.Channel).SendCoreAsync("update", new[] { update });
            return true;
        }
        return false;
    }

    internal async Task<bool> CanAccess(HttpRequest? req, string channel)
    {
        return await Access.CanAccess(req, channel);
    }

    internal async Task<Channel?> GetChannel(HttpRequest? request, string channel)
    {
        if (await Access.CanAccess(request, channel))
        {
            return await Dal.GetChannel(channel);
        }
        return null;
    }
}
