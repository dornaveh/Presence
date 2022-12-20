using StackExchange.Redis;
using CloudPresence;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);
var redis = "127.0.0.1:6379";

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR().AddStackExchangeRedis(redis);
builder.Services.AddSingleton(sp =>
{
    return new PresenceManager(
        new DAL(ConnectionMultiplexer.Connect(redis)),
        new AccessChecker(),
        sp.GetService<IHubContext<PresenceHub>>()
        );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseHttpsRedirection();
app.UseCors(builder =>
{
    builder
        .AllowAnyHeader()
        .AllowAnyMethod()
        .SetIsOriginAllowed(_ => true)
        .AllowCredentials();
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<PresenceHub>("/presence");
    endpoints.MapGet("/health", () => "Ok");
});
app.Run();
