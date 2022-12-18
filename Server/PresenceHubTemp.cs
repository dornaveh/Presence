using Microsoft.AspNetCore.SignalR;
using System.Collections.Specialized;
using System.Web;

public partial class PresenceHub
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
}