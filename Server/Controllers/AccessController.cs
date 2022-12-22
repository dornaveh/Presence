using Microsoft.AspNetCore.Mvc;

namespace CloudPresence.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccessController : ControllerBase
    {
        private ILogger<AccessController> Logger { get; }
        private PresenceManager PresenceManager { get; }
        private static readonly Who ID = new Who();

        public AccessController(ILogger<AccessController> logger, PresenceManager presenceManager)
        {
            Logger = logger;
            PresenceManager = presenceManager;
        }

        [HttpPost("update")]
        public async Task<bool> Update(UpdateMessage message)
        {
            return await PresenceManager.Update(message, HttpContext.Request);
        }

        [HttpGet("getchannels")]
        public async Task<Channel?> GetChannel(string channel)
        {
            return await PresenceManager.GetChannel(HttpContext.Request, channel);
        }

        [HttpGet("who")]
        public Who Who()
        {
            return ID;
        }
    }

    public class Who
    {
        public string Id { get; set; } =  Guid.NewGuid().ToString();
    }
}