using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Xml.Linq;

namespace CloudPresence.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccessController : ControllerBase
    {
        private readonly ILogger<AccessController> _logger;
        IHubContext<PresenceHub> _hub;

        public AccessController(ILogger<AccessController> logger, IHubContext<PresenceHub> signalr)
        {
            _logger = logger;
            _hub = signalr;
        }

        [HttpGet(Name = "getChannel")]
        public IEnumerable<Item> Get(string channel)
        {
            _hub.Clients.All.SendAsync("echo"," (echo from server)");
            List<Item> items = new List<Item>();
            items.Add(new Item { Key = "hello", Value = "world" });
            items.Add(new Item { Key = "hello2", Value = "world2" });
            return items;
        }
    }

    public class Item
    {
        public string Key { get; set; }
        public string Value { get; set; }
    }
}