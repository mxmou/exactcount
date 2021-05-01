// const proxy = "https://mxmou-gh-ca.herokuapp.com/";
const proxy = "http://localhost:8001/";
const pageSize = 40;

function error(message) {
	document.body.removeAttribute("class");
	alert(message);
}

async function countProjects(url) {
	let offset = 0;
	let delta = 100*pageSize;
	while (true) {
		console.log(`Offset: ${offset}`);
		console.log(`Delta: ${delta}`);
		const page = await (await fetch(`${url}?limit=${pageSize}&offset=${offset}`)).json();
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

function go() {
	const studio = document.querySelector("#studio-input").value;
	const apiUrlPrefix = proxy + "https://api.scratch.mit.edu/studios/" + studio + "/projects";
	document.body.className = "waiting";
	countProjects(apiUrlPrefix).then((count) => {
		document.querySelector("#count").innerText = count;
		document.body.className = "complete";
	});
}

document.querySelector("#ok").addEventListener("click", go);
document.querySelector("#studio-input").addEventListener("keyup", function(event) {
	if (event.keyCode == 13) go();
})
