// ==UserScript==
// @name         Exact count
// @namespace    github.com/mxmou
// @version      1.0
// @description  Shows exact count of projects in Scratch studios
// @author       MaxiMouse
// @homepageURL  https://github.com/mxmou/exactcount
// @supportURL   https://github.com/mxmou/exactcount/issues
// @updateURL    https://mxmou.github.io/exactcount/exactcount.user.js
// @match        https://scratch.mit.edu/studios/*
// ==/UserScript==

const pageSize = 60;

function countProjects(url, page, delta, callback) {
    console.log("Page: " + page);
    console.log("Delta: " + delta);
    const request = new XMLHttpRequest();
    request.open("GET", url + page + "/");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {
                countProjects(url, page + delta, delta, callback);
            } else if (request.status == 404) {
                if (page != 1) {
                    if (delta == 1) {
                        const correctReq = new XMLHttpRequest();
                        correctReq.open("GET", url + (page - 1) + "/");
                        correctReq.onreadystatechange = function() {
                            if (correctReq.readyState == 4) {
                                if (correctReq.status == 200) {
                                    const parser = new DOMParser();
                                    const list = parser.parseFromString(
                                        "<ul id='projects'>" + correctReq.responseText + "</ul>", "text/html"
                                    );
                                    let count = pageSize*(page - 2);
                                    count += list.querySelector("#projects").querySelectorAll("ul > li").length;
                                    callback(count);
                                } else alert("Something went wrong.");
                            }
                        };
                    correctReq.send();
                    } else {
                        page -= delta;
                        delta /= 10;
                        countProjects(url, page + delta, delta, callback);
                    }
                } else alert("Studio with this ID does not exist.");
            } else alert("Studio with this ID does not exist.");
        }
    };
    request.send();
}

if (document.querySelector("[data-count=projects]").innerText == "100+") {
    const studio = (/[0-9]+/).exec(location.href)[0];
    const apiUrlPrefix = "https://scratch.mit.edu/site-api/projects/in/" + studio + "/";
        countProjects(apiUrlPrefix, 1, 100, function(count) {
            document.querySelector("[data-count=projects]").innerText = count;
    });
}
