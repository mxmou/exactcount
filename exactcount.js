const api = "https://mxmou.eu.pythonanywhere.com/api/exactcount";
const pageSize = 40;

let currentStudio = "";
let currentMode = "projects";

async function getPageLength(url, page, cache) {
	if (Object.hasOwnProperty.call(cache, page)) return cache[page];
	const res = await fetch(`${url}?limit=${pageSize}&offset=${page*pageSize}`);
	if (res.status != 200) throw res.status;
	const length = (await res.json()).length;
	cache[page] = length;
	return length;
}

async function getCount(url) {
	let cache = {};
	let minPage = 0;
	let maxPage;
	for (maxPage = 4;; maxPage *= 2) {
		const length = await getPageLength(url, maxPage, cache);
		if (!length) break;
		else if (length < pageSize) return maxPage*pageSize + length;
		minPage = maxPage;
	}
	while (true) {
		if (maxPage - minPage <= 1) {
			return minPage*pageSize + await getPageLength(url, minPage, cache);
		}
		const page = (minPage + maxPage)/2;
		const length = await getPageLength(url, page, cache);
		if (length) {
			minPage = page;
			if (length < pageSize) return page*pageSize + length;
		} else {
			maxPage = page;
		}
	}
}

function go(mode, studio) {
	if (studio === undefined) {
		studio = document.querySelector("#studio-input").value;
		const match = studio.match(/https?:\/\/scratch\.mit\.edu\/studios\/(\d+)(\/.*)?/);
		if (match) {
			studio = match[1];
		}
	} else {
		document.querySelector("#studio-input").value = `https://scratch.mit.edu/studios/${studio}`;
	}
	currentStudio = studio;
	currentMode = mode;
	document.querySelector("#projects-button").classList.toggle("default", mode === "projects");
	document.querySelector("#curators-button").classList.toggle("default", mode === "curators");
	switch (mode) {
	case "projects":
		location.hash = `#${studio}`;
		document.body.className = "waiting";
		getCount(`${api}/studios/${studio}/projects`).then((count) => {
			document.querySelector("#project-count").innerText = count;
			document.body.className = "projects-complete";
		}).catch(() => {
			document.body.className = "projects-error";
		});
		break;
	case "curators":
		location.hash = `#${studio}/curators`;
		document.body.className = "waiting";
		Promise.all([
			getCount(`${api}/studios/${studio}/managers`),
			getCount(`${api}/studios/${studio}/curators`),
		]).then(([managers, curators]) => {
			document.querySelector("#manager-count").innerText = managers;
			document.querySelector("#curator-count").innerText = curators;
			document.body.className = "curators-complete";
		}).catch(() => {
			document.body.className = "curators-error";
		});
		break;
	}
}

document.querySelector("#projects-button").addEventListener("click", () => go("projects"));
document.querySelector("#curators-button").addEventListener("click", () => go("curators"));
document.querySelector("#studio-input").addEventListener("keyup", function(event) {
	if (event.key === "Enter") go(currentMode);
})

function handleHash() {
	const parts = location.hash.slice(1).split("/");
	const studio = parts[0];
	const mode = parts[1] || "projects";
	// Don't do anything if the hash change was caused by clicking "Show count"
	if (studio === currentStudio && mode === currentMode) return;
	if (!studio) {
		document.querySelector("#studio-input").value = "";
		document.body.className = ""; // Hide result from previous studio
		currentStudio = "";
		return;
	}
	go(mode, studio);
}
if (location.hash) handleHash();
window.addEventListener("hashchange", () => handleHash());

fetch(`${api}/proxy/featured`).then(async (res) => {
	document.querySelector("#examples").classList.remove("loading");
	const featuredStudios = (await res.json()).community_featured_studios;
	for (let example of featuredStudios) {
		const item = document.createElement("li");
		document.querySelector("#examples ul").appendChild(item);
		const button = document.createElement("button");
		button.addEventListener("click", () => {
			go(currentMode, example.id);
		});
		item.appendChild(button);
		const thumbnail = document.createElement("img");
		thumbnail.src = example.thumbnail_url;
		thumbnail.alt = "";
		thumbnail.draggable = false;
		button.appendChild(thumbnail);
		const title = document.createElement("span");
		title.innerText = example.title;
		button.appendChild(title);
	}
});
