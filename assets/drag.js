'use strict';
var Drag = {
	init: function (field, element, side) {

		var field = document.getElementById(field);
		var hrs = field.getElementsByTagName(element);
		for (var i = 0; i < hrs.length; i++) {
			hrs[i].ondrag = function (mouse) {
				if (mouse.x <= 280) return;
				Drag[side + "Resize"](mouse);
			}
		};
	},
	widthResize: function (mouse) {
		var width = get('resize').offsetWidth;
		var left = ((mouse.target.offsetParent.offsetWidth + mouse.target.offsetParent.offsetLeft + mouse.offsetX) / width) * 100;
		var right = 100 - left;
		var collWidth = mouse.x - (parent.offsetLeft + 280);
		var currCollClass = "." + mouse.target.offsetParent.classList[1];
		var nextCollClass = "." + mouse.target.offsetParent.nextElementSibling.classList[1];
		var styles = {};
		styles[currCollClass] = {
			"right": right + "% !important"
		};
		styles[nextCollClass] = {
			"left": left + "% !important"
		};
		Styles.add(styles);
	},
	heightResize: function (mouse) {
		var hr = mouse.target;
		var div = mouse.target.parentNode;
		var prev = div.previousElementSibling;
		var height = div.clientHeight + mouse.offsetY * -1;
		div.style.height = height + "px";
		prev.style.bottom = height + "px";
	},
	getClass: function (element, substr) {
		var elementClass = element.className.split(' ');
		for (var i = 0; i < elementClass.length; i++) {
			if (elementClass[i].indexOf(substr) + 1) return elementClass[i];
		};
	},

}

var Styles = {
	init: function () {
		var styleSheets = document.styleSheets;
		for (var i = 0; i < styleSheets.length; i++)
			if (styleSheets[i].title == "title")
				return styleSheets[i];

		var styleElt = document.createElement("style");
		styleElt.setAttribute('title', "title");
		document.getElementsByTagName("head")[0].appendChild(styleElt);
		return document.styleSheets[document.styleSheets.length - 1];
	},
	add: function (addStyles) {

		var styleSheet = Styles.init();
		var curStyles = Styles.parse(styleSheet);
		var setStyles = Styles.merge(addStyles, curStyles)

		var stringStyles = [];
		for (var selector in setStyles) {
			var stylesTmp = [];
			for (var prop in setStyles[selector]) {
				stylesTmp.push(prop + ':' + setStyles[selector][prop]);
			};
			stringStyles.push(selector + "{" + stylesTmp.join(';') + "}");
		}
		styleSheet.ownerNode.innerHTML = stringStyles.join("\n");
	},
	merge: function (addStyles, curStyles) {
		if (!curStyles || !object.size(curStyles)) return addStyles;
		for (var selector in addStyles) {
			if (curStyles[selector] === undefined) {
				curStyles[selector] = addStyles[selector];
			} else {
				for (var property in addStyles[selector]) {

					if (curStyles[selector][property] === undefined) {
						curStyles[selector][property] = addStyles[selector][property];
					} else {
						curStyles[selector][property] = addStyles[selector][property];
					}
				}
			}
		}
		return curStyles;
	},
	parse: function (styleSheet) {
		var result = {};
		if (styleSheet.ownerNode == null) return result;

		var currStyles = styleSheet.ownerNode.innerHTML.split("\n");
		if (currStyles[0].length) {
			var classRegex = /([\.\w\d\-]*)\{.*/i;
			var styleRegex = /\{([\d\-\w\:\;\s\%\.\!]*)\}/i;
			for (var i = 0; i < currStyles.length; i++) {
				var className = classRegex.exec(currStyles[i]);
				var classStyle = styleRegex.exec(currStyles[i]);

				if (className)
					if (className.length)
						if (className[1]) className = className[1];
				if (classStyle)
					if (classStyle.length)
						if (classStyle[1]) classStyle = classStyle[1];

				var stylesObj = {};
				if (className !== null && classStyle !== null && type(className) == 'string' && type(classStyle) == 'string') {
					var stylesArr = classStyle.split(';')
					for (var k = 0; k < stylesArr.length; k++) {
						var subStyleArr = stylesArr[k].split(':');
						stylesObj[subStyleArr[0].replace(' ', '')] = subStyleArr[1];
					};
				}
				result[className] = stylesObj;
			};

		}
		return result;
	}
}