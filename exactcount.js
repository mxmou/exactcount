const api = "https://mxmou.eu.pythonanywhere.com/api/exactcount";
const pageSize = 40;

async function getPageLength(url, page, cache) {
	if (Object.hasOwnProperty.call(cache, page)) return cache[page];
	const res = await fetch(`${url}?limit=${pageSize}&offset=${page*pageSize}`);
	if (res.status != 200) throw res.status;
	const length = (await res.json()).length;
	cache[page] = length;
	return length;
}

async function countProjects(url) {
	let cache = {};
	let minPage = 0;
	let maxPage;
	for (maxPage = 1;; maxPage *= 2) {
		const length = await getPageLength(url, maxPage, cache);
		if (!length) break;
		minPage = maxPage;
	}
	while (true) {
		if (maxPage - minPage <= 1) {
			return minPage*pageSize + await getPageLength(url, minPage, cache);
		}
		const page = (minPage + maxPage)/2;
		const length = await getPageLength(url, page, cache);
		if (length) minPage = page;
		else maxPage = page;
	}
}

function go(studio) {
	if (studio === undefined) {
		studio = document.querySelector("#studio-input").value;
		const match = studio.match(/https?:\/\/scratch\.mit\.edu\/studios\/(\d+)(\/.*)?/);
		if (match) {
			studio = match[1];
		}
	} else {
		document.querySelector("#studio-input").value = `https://scratch.mit.edu/studios/${studio}`;
	}
	const apiUrlPrefix = `${api}/studios/${studio}/projects`;
	document.body.className = "waiting";
	countProjects(apiUrlPrefix).then((count) => {
		document.querySelector("#count").innerText = count;
		document.body.className = "complete";
	}).catch(() => {
		document.body.className = "error";
	});
}

document.querySelector("#ok").addEventListener("click", () => go());
document.querySelector("#studio-input").addEventListener("keyup", function(event) {
	if (event.key == "Enter") go();
})

fetch(`${api}/proxy/featured`).then(async (res) => {
	document.querySelector("#examples").classList.remove("loading");
	const featuredStudios = (await res.json()).community_featured_studios;
	for (let example of featuredStudios) {
		const item = document.createElement("li");
		document.querySelector("#examples ul").appendChild(item);
		const button = document.createElement("button");
		button.addEventListener("click", () => {
			go(example.id);
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
