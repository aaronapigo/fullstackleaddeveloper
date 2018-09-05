using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(BingSearchTest.Startup))]
namespace BingSearchTest
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
