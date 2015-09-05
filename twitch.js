
var app = (function() {
  // pages will store an array of sub-arrays with 5 elements per page
  var pages = [[]];
  var currentPage = -1;
  var currentSearch;
  var captureQuery = /q=(.{1,})/;

  return {
    // setup for event delegation
    setUp: function(){
      document.getElementById("previous-button").addEventListener("click", this.previousPage.bind(this));
      document.getElementById("left-arrows").addEventListener("click", this.previousPage.bind(this));
      document.getElementById("next-button").addEventListener("click", this.nextPage.bind(this));
      document.getElementById("right-arrows").addEventListener("click", this.nextPage.bind(this));
      document.getElementById("search-form").addEventListener("submit", function(e){
        e.preventDefault();
        this.searchStreams(document.getElementById("search-bar").value);
      }.bind(this));
    },

    // updates page count, total results, current page, and displays navigation arrows appropriately.
    updateResultsHeader: function() {
      var resultsCount = [].concat.apply([], pages).length;
      document.getElementById("total-results").innerHTML = resultsCount;
      document.getElementById("page-count").innerHTML = currentPage+1+"/"+pages.length;

      if(currentPage === 0){
        document.getElementById("left-arrows").style.visibility = "hidden";
      }else{
        document.getElementById("left-arrows").style.visibility = "visible";
      }

      if(currentPage === pages.length-1){
        document.getElementById("right-arrows").style.visibility = "hidden";
      }else{
        document.getElementById("right-arrows").style.visibility = "visible";
      }
    },

    nextPage: function() {
      // if user is not on the last page and there are pages to display, the next page can be shown
      if(currentPage < pages.length-1 && pages[0].length > 0){
        currentPage += 1;
        var newPage = this.constructPage(currentPage);
        var oldPage = document.getElementsByClassName("page");
        newPage.className = "page slide-in";

        // Loops in case user clicks too fast and pages are not removed in time.
        for (var i = oldPage.length - 1; i >= 0; i--) {
          oldPage[i].className = "page slide-out";
        }

        // wait for previous page to transition out before removing it.
        setTimeout(function(){
          for (var i = oldPage.length - 1; i >= 0; i--) {
            if(oldPage[i].className === "page slide-out"){
              oldPage[i].remove();
            }
          }
        }, 500);

        // append new page and update header
        document.getElementById("results").appendChild(newPage);
        this.updateResultsHeader();
      }
    },

    previousPage: function() {
      // if user is not on the first page, the previous page can be displayed
      if(currentPage > 0){
        currentPage -= 1;
        var newPage = this.constructPage(currentPage);
        var oldPage = document.getElementsByClassName("page");
        newPage.className = "page slide-in-left";

        // Loops in case user clicks too fast and pages are not removed in time.
        for (var i = oldPage.length - 1; i >= 0; i--) {
          oldPage[i].className = "page slide-out-right";
        }

        // wait for previous page to transition out before removing
        setTimeout(function(){
          for (var i = oldPage.length - 1; i >= 0; i--) {
            if(oldPage[i].className === "page slide-out-right"){
              oldPage[i].remove();
            }
          }
        }, 500);

        // append new page & update header
        document.getElementById("results").appendChild(newPage);
        this.updateResultsHeader();
      }
    },

    searchStreams: function(search) {
      // replaces spaces with + for the api and stores search query for future reference
      search = search.replace(/ /g,"+");
      currentSearch = search;
      pages = [[]];
      currentPage = -1;
      this.getStreams("https://api.twitch.tv/kraken/search/streams?limit=100&q="+search+"&callback=app.saveStreams");
    },

    getStreams: function(url) {
      var script = document.createElement('script');
      script.src = url;
      // after the script is loaded (and executed), remove it
      script.onload = function () {
        this.remove();
      };
      // insert script tag into the DOM (append to <head>)
      var head = document.getElementsByTagName('head')[0];
      head.insertBefore(script, head[0]);
    },

    saveStreams: function(data) {
      // return if user began searching for something else while more pages were being loaded
      if(captureQuery.exec(data._links.self)[1] != currentSearch){
        return;
      }

      // checks to see if this is the first time we are hitting the API with a unique search query so that we can render the first page while the other pages are being loaded.
      if(pages[0].length === 0){
        var newSearch = true;
      }
      if(data.streams.length > 0){
        // add streams to the end of last page if last page has less than 5 element
        while(pages[pages.length-1].length < 5 && data.streams.length > 0){
          pages[pages.length-1].push(data.streams.shift());
        }
        // break remaining streams into sub-arrays of 5 elements to create new pages
        var i = 0;
        var n = data.streams.length;
        while (i < n) {
          pages.push(data.streams.slice(i, i += 5));
        }
        // update results and get remaining streams from twitch API
        this.updateResultsHeader();
        this.getStreams(data._links.next+"&callback=app.saveStreams");
      }else{
        this.preloadImages();
      }
      if(newSearch){
        this.nextPage();
      }
    },

    // assembles array of streams into pages
    constructPage: function(page) {
      var pageData = pages[page];
      var newPage = document.createElement("div");
      for (var i = pageData.length - 1; i >= 0; i--) {
        var row = document.createElement("div");
        var img = document.createElement("img");
        var textContainer = document.createElement("div");
        var displayName = document.createElement("h2");
        var meta = document.createElement("p");
        var description = document.createElement("p");

        row.className = "row";
        img.src = pageData[i].preview.medium;
        displayName.appendChild(document.createTextNode(pageData[i].channel.display_name));
        meta.appendChild(document.createTextNode(pageData[i].game + " - " + pageData[i].viewers + " viewers"));
        description.appendChild(document.createTextNode(pageData[i].channel.status));

        textContainer.appendChild(displayName);
        textContainer.appendChild(meta);
        textContainer.appendChild(description);

        row.appendChild(img);
        row.appendChild(textContainer);
        newPage.appendChild(row);
      }
      return newPage;
    },

    // caches images decrease loading times
    preloadImages: function() {
      var loadedPages = [].concat.apply([], pages);
      for (var i = loadedPages.length - 1; i >= 0; i--) {
        var newImage = document.createElement("img");
        newImage.src = loadedPages[i].preview.medium;
      }
    },

  };
})();

app.setUp();