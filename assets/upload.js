'use strict';
var UPLOADINTERVAL='';
var Upload = {
	_count: '',
	_countDone: 0,
	_countError: 0,
	_files: [],
	_drop: '',
	_url: '',
	_result: '',
	_func: '',
	_timeoutCallback:'',
	init: function(drop,url,input,result,func){
		Upload._drop = drop;
		Upload._url = url;
		if(result)Upload._result = result; 
		if(func)Upload._func = func;
		if(get(input)){
			get(input).addEventListener('change',function(e){
				Upload._files.length=0;
				Upload._count=0;
				Upload._countDone = 0;
				Upload._countError = 0;
				var items = e.srcElement.files;
				for (var i = 0; i < items.length; i++) {
					Upload._files.push(items[i]);
				};
				setTimeout(Upload.start,1000);
			});
		}
		window.ondragenter = function(e){
			if(e.dataTransfer.items.length>0){
				if(!get("dad")){
					document.getElementsByTagName('body')[0].appendChild(Dom.create('<div id="dad"></div>'));
					get('dad').onmouseleave = function(){console.log('leave');Dom.remove('dad');}
					get('dad').ondragleave = function(){console.log('dragleave');Dom.remove('dad');}
				}
				return false;
			}
		}
		window.ondragover = function(){return false;}
		window.ondragend = function(){Dom.remove('dad');return false;}
		window.ondrop = function (e) {
			if(e.dataTransfer.files.length){
				Upload._files.length=0;
				Upload._count=0;
				Upload._countDone = 0;
				Upload._countError = 0;
				Dom.remove(Upload._result);
				Dom.remove('dad');
				e.preventDefault();
				if(Upload.prepareCollect(e.dataTransfer.items)) setTimeout(Upload.start,500);
			}
		}
	},
	prepareCollect: function(items){
		for (var i=0; i<items.length; i++) {
			var item = items[i].webkitGetAsEntry();
			if(item) Upload.collect(item);
		}
		return true;
	},
	collect: function(item,path){
		var path = path || '';
		function file(file){
			Upload._files.push(file);
			return true;
		}
		function files(files){
			if(files.length==100) read();
			for ( var i = 0; i < files.length; i++){
				Upload.collect(files[i], path + item.name + "/");
			}
		}
		if (item.isFile) {
			item.file(file)
		}else if(item.isDirectory){
			var reader = item.createReader();
			var read = reader.readEntries.bind(reader,files);
			read();
		}
		return true;
	},
	start: function(){
		if(!Upload._count)Upload._count = Upload._files.length;
		if(Upload._result){
			Upload.animation();
		}
		clearInterval(UPLOADINTERVAL);
		if(!Upload._files.length) return;
		var data = new FormData();
				data.append('file',Upload._files[0]);
		Ajax.$FILE(data,Upload._url,'Upload.$result');

		Upload._files.shift();
		UPLOADINTERVAL = 	setTimeout(Upload.start,20000);
	},
	$result: function(result){
		try{
			JSON.parse(result);
		}
		catch(e){
			console.log(result);
			Upload.start();
			return;
		}
		Upload.start();
		Upload.importResult(result);
		

		if(!Upload._timeoutCallback) {
			Upload._timeoutCallback = setTimeout(function(){
				execute(Upload._func)(result);
				Upload._timeoutCallback='';
			},2000);
			
		}
	},
	pause: function(){
		Upload._files.length=0;
	},
	animation: function(){
		if(!get(Upload._result)){
			document.getElementsByTagName('body')[0].appendChild(Dom.create('<div id="'+Upload._result+'" class="popupWindow"><a class="fa fa-times close" onclick="Dom.remove('+Upload._result+')"></a><a class="fa fa-pause close2" onclick="Upload.pause()"></a><p>all files: <span id="Upload_count">'+Upload._count+'</span>, upload done: <span id="Upload_countDone">0</span><span id="Upload_countError"></span></p><table class="loadingTable"><tr id="loadingProgress"></tr></table><div id="popupresult"></div></div>'));
			for(var i = 0; i < Upload._count; i++){
				get("loadingProgress").innerHTML+='<td class="loadingPoint"></td>';
			}
		}else{
			get('Upload_count').innerHTML = Upload._count;
			
			
			var loadingPoint = get("loadingProgress").getElementsByTagName('td');
			for (var i = loadingPoint.length - 1; i >= 0; i--) {
				if(loadingPoint[i].className=='loadingPoint'){Class.add(loadingPoint[i],'loadingDone');return;}
			};
		}
	},
	importResult: function(json){
		console.log(json);
		Upload._countDone++;
		get('Upload_countDone').innerHTML = Upload._countDone;
		var result = JSON.parse(json),count = [];
		if(result['error']!==undefined){
			Upload._countError++;
			get('Upload_countError').innerHTML = " ("+Upload._countError+" error)";
		}
		for(var atr in result)if(atr != 'file')count.push("<a>"+atr+': '+result[atr]+"</a>");

		get('popupresult').appendChild(Dom.create('<p class="small"><b>'+result['file']+'</b><br>'+count.join(' | ')+'</p>'));
	}

}
