const proxy = "https://mxmou-gh-ca.herokuapp.com/";
const pageSize = 60;

function error(message) {
	document.body.removeAttribute("class");
	alert(message);
}

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
								} else error("Something went wrong.");
							}
						};
					correctReq.send();
					} else {
						page -= delta;
						delta /= 10;
						countProjects(url, page + delta, delta, callback);
					}
				} else error("Studio with this ID does not exist.");
			} else error("Studio with this ID does not exist.");
		}
	};
	request.send();
}

function go() {
	const studio = document.querySelector("#studio-input").value;
	const apiUrlPrefix = proxy + "https://scratch.mit.edu/site-api/projects/in/" + studio + "/";
	countProjects(apiUrlPrefix, 1, 100, function(count) {
		document.querySelector("#count").innerText = count;
		document.body.className = "complete";
	});
	document.body.className = "waiting";
}

document.querySelector("#ok").addEventListener("click", go);
document.querySelector("#studio-input").addEventListener("keyup", function(event) {
	if (event.keyCode == 13) go();
})
