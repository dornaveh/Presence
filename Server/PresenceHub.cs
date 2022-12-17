using Microsoft.AspNetCore.SignalR;
using System.Collections.Specialized;
using System.Web;

public class PresenceHub : Hub
{
    private string User
    {
        get
        {
            var qs = this.Context?.GetHttpContext()?.Request.QueryString.ToString() ?? "";
            NameValueCollection query = HttpUtility.ParseQueryString(qs);
            return query["access_token"] ?? "NOUSER";
        }
    }

    private bool CanAccess(string channel)
    {
        return channel.Contains(User);
    }

    public async Task Echo(string message)
    {
        await Clients.All.SendAsync("echo", message + " (echo from server)");
    }

    public async Task<bool> UpdateChannel(PresenceMessage value)
    {
        if (CanAccess(value.Channel))
        {
            await Clients.Groups(value.Channel).SendCoreAsync("update", new[] { value });
            return true;
        }
        return false;
    }

    public async Task<bool> Subscribe(string channel)
    {
        if (CanAccess(channel))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channel);
            return true;
        }
        return false;
    }

    public class PresenceMessage
    {
        public string Channel { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
    }
}