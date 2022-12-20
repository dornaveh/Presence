using Microsoft.AspNetCore.SignalR;

namespace CloudPresence;

public class PresenceHub : Hub
{
    private PresenceManager PresenceManager { get; }

    public PresenceHub(PresenceManager presenceManager)
    {
        this.PresenceManager = presenceManager;
    }

    public async Task<bool> Update(UpdateMessage message)
    {
        return await PresenceManager.Update(message, this.Context?.GetHttpContext()?.Request);
    }

    public async Task Unsubscribe(string channel)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);
    }

    public async Task<Channel?> Subscribe(string channel)
    {
        var req = this.Context?.GetHttpContext()?.Request;
        if (await PresenceManager.CanAccess(req, channel))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channel);
            return await PresenceManager.GetChannel(this.Context?.GetHttpContext()?.Request, channel);
        }
        return null;
    }
}