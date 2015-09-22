'use strict';
// здесь собраны типовые функции которые часто используются в проекте.

var Ajax = {
	$GET: function (send, url, where) {
		if (type(send) == 'array') send = send.join('/');
		Ajax.send('GET', '', url + "/" + send, where, "application/x-www-form-urlencoded");
	},
	$FILE: function (send, url, where) {
		Ajax.send('POST', send, url, where, false);
	},
	$POST: function (send, url, where) {
		if (type(send) == 'object' || type(send) == 'storage') send = object.toString(send, '&');
		Ajax.send('POST', send, url, where, "application/x-www-form-urlencoded");
	},
	$JSON: function (send, url, where) {
		if (type(send) == 'object' || type(send) == 'storage') send = JSON.stringify(send)
		Ajax.send('POST', send, url, where, "application/json");
	},
	$PLAIN: function (send, url, where) {
		if (type(send) != 'string') send = object.toString(send, "\n");
		Ajax.send('POST', send, url, where, "text/plain");
	},
	init: function () {
		var xmlhttp;
		try {
			xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (E) {
				xmlhttp = false;
			}
		}
		if (!xmlhttp && typeof XMLHttpRequest != 'undefined') xmlhttp = new XMLHttpRequest();
		return xmlhttp;
	},
	send: function (protocol, send, url, where, header) {
		var xmlhttp = Ajax.init();
		url = url.replace(/\/\//g, '/');
		xmlhttp.open(protocol, url);
		if (header) xmlhttp.setRequestHeader("Content-type", header);
		xmlhttp.send(send);
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
				if (where) Ajax.engine(where, xmlhttp.responseText);
				else console.log(xmlhttp.responseText)
			}
		}
	},
	engine: function (where, result) {
		if (!where) console.log(result);
		else if ((typeof where) == 'object') {
			// console.log(where,Dom.create(result));
			if (where.getAttribute('plus') != null) where.appendChild(Dom.create(result));
			else where.innerHTML = result;
		} else if (where[0] == '#') {
			if (get(where.slice(1))) {
				var element = get(where.slice(1));
				if (element.tagName == 'INPUT') element.value = result;
				element.innerHTML = result;
			}
		} else if (where[0] == '@') {
			if (get(where.slice(1))) get(where.slice(1)).outerHTML = result;
		} else if (where[0] == '+') {
			get(where.slice(1)).appendChild(Dom.create(result));
		} else {
			execute(where)(result);
		}
	}
}

function execute(string) {
	var string = string.split('.'); // кастыль
	if (string.length == 3) return window[string[0]][string[1]][string[2]];
	if (string.length == 2) return window[string[0]][string[1]];
	if (string.length == 1) return window[string[0]];
}

function get(id) {
	return document.getElementById(id) || document.getElementsByTagName(id)[0];
}


function extension(file) {
	return filename.split('.').pop();
}

function findNode(needle, haystack) {
	for (var key in needle) {
		for (var i = 0; i < haystack.length; i++) {
			if (haystack[i].nodeName != '#text' && haystack[i].getAttribute(key) == needle[key]) return haystack[i];
		};
	}
	return false;
}

var Dom = {
	remove: function (element) {
		if (type(element) == 'string') element = get(element);
		if (!element) return false;
		return element.parentNode ? element.parentNode.removeChild(element) : element;
	},
	create: function (string) {
		var container = document.createElement('div')
		container.innerHTML = string;
		return container.firstElementChild;
	}
}

var Submit = {
	form: function () {
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		for (var i = 0, data = {}; i < event.target.length; i++) {
			if (event.target[i].type == 'checkbox' || event.target[i].type == 'radio') {
				data[event.target[i].name] = event.target[i].checked;
			} else {
				data[event.target[i].name] = event.target[i].value;
			}
		};
		var url = event.target.action || event.target.getAttribute('url');
		url = url.replace(window.location.protocol + '//' + window.location.host, '');
		Ajax.$POST(data, url, event.target.getAttribute('where') || '');
	},
	link: function (data) {
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		var url = event.target.href.replace(window.location.protocol + '//' + window.location.host, '');
		Ajax.$GET(data || '', url, event.target.target || '');
	},
	file: function (where) {
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		var data = new FormData();
		data.append('file', event.target.files[0]);
		var url = event.target.getAttribute('action');
		Ajax.$FILE(data, url, where ? where : '');
	},
	send: function (data) {
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		var where = event.target.getAttribute('where') || '';
		var url = event.target.getAttribute('url') || event.target.href || event.target.action || event.target.getAttribute('action');
		url = url.replace(window.location.protocol + '//' + window.location.host, '');
		var method = event.target.getAttribute('method') || event.target.method || (event.target.tagName=='INPUT'?'FILE':undefined) ||'GET';
		var data = data || Submit.formData(event.target) || Submit.inputfile(event.target) || '';
		console.log('$' + method.toUpperCase(), data, url, where);

		Ajax['$' + method.toUpperCase()](data, url, where);
	},
	formData: function (form) {

		if (form.tagName != "FORM") return undefined;
		var data = {};

		for (var i = 0; i < form.length; i++) {
			if (!form[i].name) continue;
			if (form[i].type == 'checkbox' || form[i].type == 'radio') {
				data[form[i].name] = form[i].value.replace(/[\n\r]*/g, '') || form[i].checked;
			} else {
				data[form[i].name] = form[i].value.replace(/[\n\r\t]*/g, '');
			}
		};

		console.log(data);
		return data;
	},
	inputfile: function(input){
		if (input.tagName != "INPUT") return undefined;
		var data = new FormData();
		for (var i = 0; i < input.files.length; i++) {
			data.append('file',input.files[i]);
		};
		return data;
	}
}

var object = {
	merge: function (obj1, obj2) {
		if (!obj1) return obj2;
		if (!obj2) return obj1;

		if (!object.size(obj1)) return obj2;
		if (!object.size(obj2)) return obj1;

		if (type(obj1) == 'string') obj1 = JSON.parse(obj1);
		if (type(obj2) == 'string') obj2 = JSON.parse(obj2);

		var result = {};
		for (var atr in obj2) result[atr] = obj2[atr];
		for (var atr in obj1) result[atr] = obj1[atr];
		//при одинаковых значениях в результате окажется знаечение obj1 так как он приравнивается последним.
		// return (type(result)=='string')?JSON.stringify(result):result;
		return JSON.stringify(result);
	},
	collapse: function (obj1, obj2, arg) { // сливаем два объекта в один в OBJ2
		// если какого-то из объектов нет, то возвращаем другой
		if (!obj1) return obj2;
		if (!obj2) return obj1;

		// если вместо объекта строки, то предполагаем, что это нераспарсенная JSON строка - делаем объекты
		if (type(obj1) == 'string') obj1 = JSON.parse(obj1);
		if (type(obj2) == 'string') obj2 = JSON.parse(obj2);

		for (var atr1 in obj1) {
			if (obj2[atr1] === undefined) { // если такого аттрибута у второго объекта нет, то создаем его со значением первого
				obj2[atr1] = obj1[atr1];
			} else {
				if (type(obj1[atr1]) == 'string' || type(obj1[atr1]) == 'array') { // если строка или массив, то объединяем эти значения
					if (arg && arg.indexOf('s') + 1) obj2[atr1] = obj1[atr1];
					else if (arg && arg.indexOf('c') + 1) {
						if (!obj1[atr1]) {
							delete obj2[atr1];
						} else {
							obj2[atr1] = obj1[atr1]
						};
					} else obj2[atr1] = [obj1[atr1]].concat(obj2[atr1]);
				} else if (type(obj1[atr1]) == 'object') { // если ОБА объекты, копаем дальше
					var recursive = object.collapse(obj1[atr1], obj2[atr1], arg);
					if (type(recursive) == 'string') recursive = JSON.parse(recursive);
					obj2[atr1] = recursive;
				}
			}
		}
		// return (type(obj2)=='string')?JSON.stringify(obj2):obj2;// возвращем объединенный объект строкой!
		return JSON.stringify(obj2);
	},
	size: function (obj) {
		if (type(obj) == 'string') obj = JSON.parse(obj);
		var size = 0;
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	},
	toString: function (obj, sep, escape) {
		var sep = sep || ',';
		var array = [];
		for (var node in obj) {
			if (escape != undefined && escape == true) {
				obj[node] = htmlentities(obj[node]);
			}
			array.push(node + '=' + obj[node]);
		}

		return array.join(sep);
	}
}

function type(obj) {
	return Object.prototype.toString.call(obj).match(/\w*\s(\w*)/i)[1].toLowerCase();
}

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

function htmlentities(s) {
	var div = document.createElement('div');
	var text = document.createTextNode(s);
	div.appendChild(text);
	return div.innerHTML;
}

function include(url, callBack) {
	var script = document.createElement('script');
	var url = ('/' + url).replace('//', '/');
	script.src = window.location.protocol + '//' + window.location.host + url;
	document.getElementsByTagName('head')[0].appendChild(script);
	script.onload = function () {
		execute(callBack)(true);
	}
	script.onreadystatechange = function () {
		execute(callBack)(true);
	}
}

function is_json(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

function insertAfter(elem, refElem) {
  return refElem.parentNode.insertBefore(elem, refElem.nextSibling);
}