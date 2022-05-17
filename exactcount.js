const proxy = "https://mxmou-gh-ca.herokuapp.com/";
// const proxy = "http://localhost:8001/";
const pageSize = 40;

async function countProjects(url) {
	let offset = 0;
	let delta = 100*pageSize;
	while (true) {
		console.log(`Offset: ${offset}`);
		console.log(`Delta: ${delta}`);
		const res = await fetch(`${url}?limit=${pageSize}&offset=${offset}`);
		if (res.status != 200) throw res.status;
		const page = await res.json();
		if (page.length) {
			offset += delta;
		} else if (delta > pageSize) {
			offset -= delta;
			delta /= 10;
			offset += delta;
		} else {
			offset -= delta;
			const lastPage = await (await fetch(`${url}?limit=${pageSize}&offset=${offset}`)).json();
			return offset + lastPage.length;
		}
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
	const apiUrlPrefix = proxy + "https://api.scratch.mit.edu/studios/" + studio + "/projects";
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

fetch(proxy + "https://api.scratch.mit.edu/proxy/featured").then(async (res) => {
	const featuredStudios = (await res.json()).community_featured_studios;
	for (let example of featuredStudios) {
		const item = document.createElement("li");
		document.querySelector("#examples").appendChild(item);
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
