using BingSearchTest.Helper;
using BingSearchTest.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BingSearchTest.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
        public virtual JsonResult SearchBing(string query)
        { 
            JsonResponseResult result = new JsonResponseResult();
            ApiHelper helper = new ApiHelper();
            result = helper.SearchBing(query);
            return Json(result, JsonRequestBehavior.AllowGet);
        }
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}