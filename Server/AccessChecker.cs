using System.Collections.Specialized;
using System.Web;

namespace CloudPresence;

public class AccessChecker
{
    public string GetUserId(HttpRequest? req)
    {
        var qs = req?.QueryString.ToString() ?? "";
        NameValueCollection query = HttpUtility.ParseQueryString(qs);
        return query["access_token"] ?? "NOUSER";
    }

    public Task<bool> CanAccess(HttpRequest? req, string channel)
    {
        if (req == null)
        {
            throw new ArgumentNullException("req");
        }
        return Task.FromResult(channel.ToLower().Contains(GetUserId(req).ToLower()));
    }
}