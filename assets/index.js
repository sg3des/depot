'use strict'

window.onload = function() {
	console.log("load")
}

document.onkeydown = function(event) {
	if (event.which == 83 && event.ctrlKey) { //ctrl+s
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		toolbar.save(datafield.name, datafield)
		return false
	}
}

var toolbar = {
	save: function(type, datafield) {
		var data = {}
		var filename
		for (var i = 0; i < datafield.elements.length; i++) {
			if (datafield.elements[i].name == "filename") {
				filename = datafield.elements[i].value
				continue
			}
			data[datafield.elements[i].name] = datafield.elements[i].value
		}

		var jdata = toolbar[type](data)

		Ajax.$JSON(jdata, "/" + type + "/" + filename, "#message")
	},
	document: function(data) {
		return data
	},
	spreadsheet: function(data) {
		var jdata = {}
		for (var key in data) {
			var k = key.split(":")
			if (jdata[k[0]] == undefined) jdata[k[0]] = []
			jdata[k[0]][k[1]] = data[key]
		}
		return jdata
	}
}

var spreadsheet = {
	edit: function(td) {
		td.contentEditable = true;
		td.focus()
	},
	blur: function(td) {
		td.contentEditable = false;
	},
	focus: function(td) {
		// selectText(td)
		var selected = get("spreadsheet").querySelectorAll(".select")
		for (var i = 0; i < selected.length; i++) selected[i].classList.remove("select")
		td.classList.add("select")
	},
	selectStart: function(td) {
		var tds = get("spreadsheet").querySelectorAll("td")
		for (var i = 0; i < tds.length; i++) {
			tds[i].classList.remove("mark")
		};

		var sr = td.getAttribute("row")
		var sc = td.getAttribute("cell")

		var tds = get("spreadsheet").querySelectorAll("td")
		for (var i = 0; i < tds.length; i++) {
			tds[i].onmouseover = function(event) {
				var er = event.target.getAttribute("row")
				var ec = event.target.getAttribute("cell")
				spreadsheet.selectSquare(sr, sc, er, ec)
			}
		}
	},
	selectSquare: function(sr, sc, er, ec) {
		var tmp
		if (er < sr) tmp = sr, sr = er, er = tmp;
		if (ec < sc) tmp = sc, sc = ec, ec = tmp;
		var tds = get("spreadsheet").getElementsByTagName("td")
		for (var i = 0; i < tds.length; i++) {
			var r = tds[i].getAttribute("row")
			var c = tds[i].getAttribute("cell")
			if (r == null || c == null) continue
			if (r >= sr && r <= er && c >= sc && c <= ec) {
				tds[i].classList.add("mark")
			} else {
				tds[i].classList.remove("mark")
			}
		}
	},
	selectEnd: function(td) {
		var tds = get("spreadsheet").getElementsByTagName("td")
		for (var i = 0; i < tds.length; i++) {
			tds[i].onmouseover = null
		}
		var tds = get("spreadsheet").querySelectorAll(".mark")
		if (tds.length <= 1) {
			for (var i = 0; i < tds.length; i++) tds[i].classList.remove("mark")
			return
		}
		var data = {}
		for (var i = 0; i < tds.length; i++) {
			if (data[tds[i].getAttribute("row")] == undefined) data[tds[i].getAttribute("row")] = []
			data[tds[i].getAttribute("row")][tds[i].getAttribute("cell")] = tds[i].innerHTML
		}
		for (var row in data) {
			data[row] = data[row].join("	")
		}
		var copyarea = get('copyarea')
		copyarea.innerHTML = Object.keys(data).map(function(key) {
			return data[key]
		}).join("\r\n");

		copyarea.select()
	},
	alphabet: {
		"": ""
	},
	addCol: function(btn) {
		var numnew = parseInt(btn.parentNode.getAttribute("cell"))
		var numlast = numnew - 1

		var rows = get("spreadsheet").getElementsByTagName("tr")
		for (var i = 0; i < rows.length; i++) {
			// var lastcell
			var lastcell = rows[i].querySelector("[cell='" + numlast + "']")
			// if (lastcell == null){
			// lastcell = rows[i].querySelector("td[cell='"+numlast+"']")
			// }
			console.log(lastcell, rows[i], numnew, numlast)
			var newcell = lastcell.cloneNode(true)
			newcell.setAttribute("cell", numnew)
			newcell.innerHTML = numnew
			rows[i].insertBefore(newcell, rows[i].children[numnew + 1])
			// rows[i].appendChild(newcell)
		}

	}
}

	function selectText(start, end) {
		var sel = window.getSelection()
		sel.setBaseAndExtent(start, 0, end, 1)
	}