

API_KEY_COOKIE = "bing-search-api-key";
CLIENT_ID_COOKIE = "bing-search-client-id";



try {
    localStorage.getItem; 
    window.retrieveValue = function (name) {
        return localStorage.getItem(name) || "";
    }
    window.storeValue = function (name, value) {
        localStorage.setItem(name, value);
    }
} catch (e) {
    window.retrieveValue = function (name) {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var keyvalue = cookies[i].split("=");
            if (keyvalue[0].trim() === name) return keyvalue[1];
        }
        return "";
    }
    window.storeValue = function (name, value) {
        var expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        document.cookie = name + "=" + value.trim() + "; expires=" + expiry.toUTCString();
    }
}

function checkSubscriptionKey() {
    var key = 'c3477a1ac96344d6bbe45f69fe433861';
    while (key.length !== 32) {
        key = prompt("Enter Bing Search API subscription key:", "").trim();
    }
    storeValue(API_KEY_COOKIE, key);
    return key;
}
function clearSubscriptionKey() {
    storeValue(API_KEY_COOKIE, "");
}

function escapeQuotes(text) {
    return text.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

function getHost(url) {
    return url.replace(/<\/?b>/g, "").replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
}

function preFormat(text) {
    text = "" + text;
    return "<pre>" + text.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</pre>"
}

function showDiv(id, html) {
    var content = document.getElementById("_" + id)
    if (content) content.innerHTML = html;
    var wrapper = document.getElementById(id);
    if (wrapper) wrapper.style.display = html.trim() ? "block" : "none";
}

function hideDivs() {
    for (var i = 0; i < arguments.length; i++) {
        var element = document.getElementById(arguments[i])
        if (element) element.style.display = "none";
    }
}

searchItemRenderers = {
    webPages: function (item) {
        var html = [];
        html.push("<p class='webPages'><a href='" + item.url + "'>" + item.name + "</a>");
        html.push(" (" + getHost(item.displayUrl) + ")");
        html.push("<br>" + item.snippet);
        if ("deepLinks" in item) {
            var links = [];
            for (var i = 0; i < item.deepLinks.length; i++) {
                links.push("<a href='" + item.deepLinks[i].url + "'>" +
                    item.deepLinks[i].name + "</a>");
            }
            html.push("<br>" + links.join(" - "));
        }
        return html.join("");
    },
    news: function (item) {
        var html = [];
        html.push("<p class='news'>");
        if (item.image) {
            width = 60;
            height = Math.round(width * item.image.thumbnail.height / item.image.thumbnail.width);
            html.push("<img src='" + item.image.thumbnail.contentUrl +
                "&h=" + height + "&w=" + width + "' width=" + width + " height=" + height + ">");
        }
        html.push("<a href='" + item.url + "'>" + item.name + "</a>");
        if (item.category) html.push(" - " + item.category);
        if (item.contractualRules) {   
            html.push(" (");
            var rules = [];
            for (var i = 0; i < item.contractualRules.length; i++)
                rules.push(item.contractualRules[i].text);
            html.push(rules.join(", "));
            html.push(")");
        }
        html.push(" (" + getHost(item.url) + ")");
        html.push("<br>" + item.description);
        return html.join("");
    },
    images: function (item, section, index, count) {
        var height = 60;
        var width = Math.round(height * item.thumbnail.width / item.thumbnail.height);
        var html = [];
        if (section === "sidebar") {
            if (index) html.push("<br>");
        } else {
            if (!index) html.push("<p class='images'>");
        }
        html.push("<a href='" + item.hostPageUrl + "'>");
        var title = escapeQuotes(item.name) + "\n" + getHost(item.hostPageDisplayUrl);
        html.push("<img src='" + item.thumbnailUrl + "&h=" + height + "&w=" + width +
            "' height=" + height + " width=" + width + " title='" + title + "' alt='" + title + "'>");
        html.push("</a>");
        return html.join("");
    },
    videos: function (item, section, index, count) {
        return searchItemRenderers.images(item, section, index, count);
    },
    relatedSearches: function (item, section, index, count) {
        var html = [];
        if (section !== "sidebar") html.push(index === 0 ? "<h2>Related</h2>" : " - ");
        else html.push("<p class='relatedSearches'>");
        html.push("<a href='#' onclick='return doRelatedSearch(&quot;" +
            escapeQuotes(item.text) + "&quot;)'>");
        html.push(item.displayText + "</a>");
        return html.join("");
    }
}

function renderResultsItems(section, results) {

    var items = results.rankingResponse[section].items;
    var html = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var type = item.answerType[0].toLowerCase() + item.answerType.slice(1);
        if (type in results && type in searchItemRenderers) {
            var render = searchItemRenderers[type];
            if ("resultIndex" in item) {
                html.push(render(results[type].value[item.resultIndex], section));
            } else {
                var len = results[type].value.length;
                for (var j = 0; j < len; j++) {
                    html.push(render(results[type].value[j], section, j, len));
                }
            }
        }
    }
    return html.join("\n\n");
}

function renderSearchResults(results) {

    if (results.queryContext.alteredQuery)
        document.forms.bing.query.value = results.queryContext.alteredQuery;

    var pagingLinks = renderPagingLinks(results);
    showDiv("paging1", pagingLinks);
    showDiv("paging2", pagingLinks);

    for (section in { pole: 0, mainline: 0, sidebar: 0 }) {
        if (results.rankingResponse[section])
            showDiv(section, renderResultsItems(section, results));
    }
}

function renderErrorMessage(message) {
    showDiv("error", preFormat(message));
    showDiv("noresults", "No results.");
}

function handleOnLoad() {
    hideDivs("noresults");

    var json = this.responseText.trim();
    var jsobj = {};

    try {
        if (json.length) jsobj = JSON.parse(json);
    } catch (e) {
        renderErrorMessage("Invalid JSON response");
    }

    showDiv("json", preFormat(JSON.stringify(jsobj, null, 2)));
    showDiv("http", preFormat("GET " + this.responseURL + "\n\nStatus: " + this.status + " " +
        this.statusText + "\n" + this.getAllResponseHeaders()));

    if (this.status === 200) {
        var clientid = this.getResponseHeader("X-MSEdge-ClientID");
        if (clientid) retrieveValue(CLIENT_ID_COOKIE, clientid);
        if (json.length) {
            if (jsobj._type === "SearchResponse" && "rankingResponse" in jsobj) {
                renderSearchResults(jsobj);
            } else {
                renderErrorMessage("No search results in JSON response");
            }
        } else {
            renderErrorMessage("Empty response (are you sending too many requests too quickly?)");
        }
    }

    else {
        if (this.status === 401) clearSubscriptionKey();

        var errors = jsobj.errors || [jsobj];
        var errmsg = [];
        errmsg.push("HTTP Status " + this.status + " " + this.statusText + "\n");

        for (var i = 0; i < errors.length; i++) {
            if (i) errmsg.push("\n");
            for (var k in errors[i]) errmsg.push(k + ": " + errors[i][k]);
        }
        var traceid = this.getResponseHeader("BingAPIs-TraceId");
        if (traceid) errmsg.push("\nTrace ID " + traceid);

        renderErrorMessage(errmsg.join("\n"));
    }
}

function bingWebSearch(query, options, key) {

    window.scrollTo(0, 0);
    if (!query.trim().length) return false;  

    showDiv("noresults", "Working. Please wait.");
    hideDivs("pole", "mainline", "sidebar", "_json", "_headers", "paging1", "paging2", "error");

    var endpoint = "https://api.cognitive.microsoft.com/bing/v7.0/search";
    var request = new XMLHttpRequest();
    var queryurl = endpoint + "?q=" + encodeURIComponent(query) + "&" + options;

    try {
        request.open("GET", queryurl);
    }
    catch (e) {
        renderErrorMessage("Bad request (invalid URL)\n" + queryurl);
        return false;
    }

    request.setRequestHeader("Ocp-Apim-Subscription-Key", key);
    request.setRequestHeader("Accept", "application/json");
    
    request.addEventListener("load", handleOnLoad);

    request.addEventListener("error", function () {
        renderErrorMessage("Error completing request");
    });

    request.addEventListener("abort", function () {
        renderErrorMessage("Request aborted");
    });

    request.send();
    return false;
}

function bingSearchOptions(form) {

    var options = [];
    options.push("SafeSearch=" + (form.safe.checked ? "strict" : "off"));
    if (form.when.value.length) options.push("freshness=" + form.when.value);
    var what = [];
    for (var i = 0; i < form.what.length; i++)
        if (form.what[i].checked) what.push(form.what[i].value);
    if (what.length) {
        options.push("promote=" + what.join(","));
        options.push("answerCount=9");
    }
    options.push("count=" + form.count.value);
    options.push("offset=" + form.offset.value);
    options.push("textDecorations=true");
    options.push("textFormat=HTML");
    return options.join("&");
}

function toggleDisplay(id) {

    var element = document.getElementById(id);
    if (element) {
        var display = element.style.display;
        if (display === "none") {
            element.style.display = "block";
            window.scrollBy(0, 200);
        } else {
            element.style.display = "none";
        }
    }
    return false;
}
function doRelatedSearch(query) {

    var bing = document.forms.bing;
    bing.query.value = query;
    bing.offset.value = 0;
    return bingWebSearch(query, bingSearchOptions(bing), checkSubscriptionKey());
}

function renderPagingLinks(results) {

    var html = [];
    var bing = document.forms.bing;
    var offset = parseInt(bing.offset.value, 10);
    var count = parseInt(bing.count.value, 10);
    html.push("<p class='paging'><i>Results " + (offset + 1) + " to " + (offset + count));
    html.push(" of about " + results.webPages.totalEstimatedMatches + ".</i> ");
    html.push("<a href='#' onclick='return doPrevSearchPage()'>Prev</a> | ");
    html.push("<a href='#' onclick='return doNextSearchPage()'>Next</a>");
    return html.join("");
}

function doNextSearchPage() {

    var bing = document.forms.bing;
    var query = bing.query.value;
    var offset = parseInt(bing.offset.value, 10);
    var count = parseInt(bing.count.value, 10);
    offset += count;
    bing.offset.value = offset;
    return bingWebSearch(query, bingSearchOptions(bing), checkSubscriptionKey());
}

function doPrevSearchPage() {

    var bing = document.forms.bing;
    var query = bing.query.value;
    var offset = parseInt(bing.offset.value, 10);
    var count = parseInt(bing.count.value, 10);
    if (offset) {
        offset -= count;
        if (offset < 0) offset = 0;
        bing.offset.value = offset;
        return bingWebSearch(query, bingSearchOptions(bing), checkSubscriptionKey());
    }
    alert("You're already at the beginning!");
    return false;
}

