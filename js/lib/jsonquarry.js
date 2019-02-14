var JsonQuarry = (function(){
	function lambda(str){
		if(!str) return;
		if(typeof(str)=="function") return str;
		if(str.indexOf("|")<0) return str;
		var arr = str.split("|");
		if(arr.length!=2) return str;
		return new Function(arr[0], "return "+arr[1]);
	}
	
	function each(coll, F){
		if(!coll || !F) return;
		if(coll instanceof Array){
			if(coll.forEach)
				coll.forEach(F);
			else for(var i=0,e; e=coll[i],i<coll.length; i++){
				F(e, i);
			}
		}
		else{
			var idx = 0;
			for(var k in coll) F(coll[k], k, idx++);
		}
	}
	
	function aggregate(coll, initial, F){
		if(!coll || !F) return initial;
		initial = initial||0;
		
		F = lambda(F);
		if(coll instanceof Array && coll.reduce){
			return coll.reduce(function(s,e){return F(e, s);}, initial);
		}
		else{
			var res = initial;
			each(coll, function(e){
				res = F(e, res);
			});
		}
		return res;
	}
	
	function extend(o, s, deep){
		if(!s) return;
		o = o||{};
		deep = deep || false;
		for(var k in s){
			var el = o[k];
			if(deep && typeof(el)=="object")
				extend(el, s[k]);
			else
				o[k] = s[k];
		}
	}
	
	function map(coll, F){
		if(!coll) return [];
		if(!F) return coll;
		F = lambda(F);
		var res;
		if(coll instanceof Array){
			if(coll.map) return coll.map(F);
			res = [];
			each(coll, function(e, i){
				res.push(F(e, i, i));
			});
		}
		else{
			res = {};
			var idx = 0;
			each(coll, function(e, k){
				res[k] = (F(e, k, idx++));
			});
		}
		return res;
	}
	
	function select(coll, F){
		if(!coll) return [];
		if(!F) return coll;
		F = lambda(F);
		var res;
		if(coll instanceof Array){
			if(coll.filter) return coll.filter(F);
			res = [];
			each(coll, function(e, i){
				if(F(e, i)) res.push(e);
			});
		}
		else{
			res = {};
			each(coll, function(e, k){
				if(F(e, k)) res[k] = e;
			});
		}
		return res;
	}
	
	function first(coll, count){
		if(!coll) return [];
		count = count || 1;
		var res = [];
		if(coll instanceof Array){
			for(var i=0; i<count && i<coll.length; i++){
				res.push(coll[i]);
			}
		}
		return res;
	}
	
	
	function flat(arr, F){
		if(!arr) return [];
		F = lambda(F);
		var res = [];
		if(typeof(arr)!="object") return arr;
		if(!arr) return res;
		for(var el,i=0; el=arr[i],i<arr.length; i++){
			res = res.concat(el);
			if(F){
				var chColl = flat(F(el), F);
				if(chColl) res = res.concat(chColl);
			}
		}
		return res;
	}
	
	function page(coll, size, nr){
		if(!coll) return [];
		if(nr<1) return [];
		var res = [],
		minIdx = size*(nr-1),
		maxIdx = size*nr;
		if(coll instanceof Array){
			for(var i=minIdx; i<maxIdx && i<coll.length; i++){
				res.push(coll[i]);
			}
		}
		return res;
	}
	
	function index(coll, F, Fobj){
		if(!coll) return {};
		if(!F) F = function(x){return x;};
		F = lambda(F);
		Fobj = lambda(Fobj);
		var res;
		if(typeof(F)=="string"){
			res = {};
			each(coll, function(e, i){
				if(e) res[e[F]] = Fobj?Fobj(e, i):e;
			});
		}
		else{
			res = {};
			each(coll, function(e, i){
				if(e) res[F(e)] = Fobj?Fobj(e, i):e;
			});
		}
		return res;
	}
	
	function keys(obj){
		if(!obj) return [];
		if(Object.keys) return Object.keys(obj);
		var res = [];
		for(var k in obj) res.push(k);
		return res;
	}
	
	function groupBy(coll, F){
		if(!coll) return {};
		F = lambda(F);
		var res;
		if(typeof(F)=="string"){
			res = {};
			each(coll, function(e){
				if(!e) return;
				var k = e[F];
				if(!res[k]) res[k] = [];
				res[k].push(e);
			});
		}
		else{
			res = {};
			each(coll, function(e){
				if(!e) return;
				var k = F(e);
				if(!res[k]) res[k] = [];
				res[k].push(e);
			})
		}
		return res;
	}
	
	function concat(coll, c2){
		if(!coll && !c2) return [];
		if(!coll) return c2;
		if(!c2) return coll;
		if(typeof(c2.raw)=="function") c2 = c2.raw();
		res = [];
		each(coll, function(e){res.push(e);});
		each(c2, function(e){res.push(e);});
		return res;
	}
	
	function toArray(coll, F){
		if(!coll) return [];
		F = lambda(F);
		if(coll instanceof Array) return coll;
		res = [];
		var mapMode = typeof(F)=="function";
		each(coll, function(e, k){
			res.push(mapMode?F(e, k):e);
		});
		return res;
	}
	
	function treeToArray(coll, childField, F){
		if(!coll) return [];
		if(!childField) return [];
		if(!F) return [];
		F = lambda(F);
		res = [];
		function tree(nd){
			var v = typeof(F)=="function"?F(nd):nd[F];
			res.push(v);
			each(nd[childField], tree);
		}
		tree(coll);
		return res;
	}
	
	function sort(coll, F){
		if(!coll) return [];
		if(!F){return coll.sort();}
		else if(typeof(F)=="function"){
			return coll.sort(F);
		}
		else if(typeof(F)=="string"){
			// F = lambda(F);
			return coll.sort(function(a,b){
				return a[F]>b[F]?1:a[F]<b[F]?-1:0;
			});
		}
	}
	
	function reverse(coll){
		if(!coll) return [];
		if(coll instanceof Array && coll.reverse) return coll.reverse();
		var res = [];
		for(var i=coll.length-1; i>=0; i--){
			res.push(coll[i]);
		}
		return res;
	}
	
	function JSQ(coll){
		if(!coll) coll = [];
		if(typeof(coll.raw)=="function") coll = coll.raw();
		var mon = (function(){
			return {
				raw: function(){return coll;},
				trace: function(msg){
					if(msg) console.log(msg, coll);
					else console.log(coll);
					return this;
				},
				map: function(F){return JSQ(map(coll, F));},
				each: function(F){each(coll, F); return this;},
				aggregate: function(initial, F){return aggregate(coll, initial, F)},
				select: function(F){return JSQ(select(coll, F));},
				first: function(count){return JSQ(first(coll, count));},
				flat: function(F){return JSQ(flat(coll, F))},
				page: function(size, nr){return JSQ(page(coll, size, nr));},
				index: function(F, Fobj){return JSQ(index(coll, F, Fobj));},
				keys: function(){return JSQ(keys(coll));},
				groupBy: function(F){return JSQ(groupBy(coll, F));},
				extend: function(c2, deep){
					if(typeof(c2.raw)=="function") c2 = c2.raw();
					res = typeof(coll.raw)=="function"?coll.raw():coll;
					// each(coll, function(e,k){res[k] = e;});
					// each(c2, function(e, k){res[k] = e;});
					extend(res, c2, deep);
					return JSQ(res);
				},
				concat: function(c2){return JSQ(concat(coll, c2));},
				toArray: function(F){
					if(this.raw() instanceof Array) return this;
					return JSQ(toArray(coll, F));
				},
				treeToArray: function(childField, F){return JSQ(treeToArray(coll, childField, F));},
				sort: function(F){return JSQ(sort(coll, F));},
				reverse: function(){
					return JSQ(reverse(coll));
				}
			};
		})();
		return mon;
	}
	
	function Dictionary(){var _=this;
		var data = {};
		
		_.empty = function(){
			for(var k in data) return false;
			return true;
		};
		_.set = function(name, val){
			val = val || true;
			data[name] = val;
		}
		_.get = function(name){
			return data[name];
		}
		_.count = function(){
			var n = 0;
			for(var k in data) n++;
			return n;
		}
		_.data = function(){
			return data;
		}
	}
	
	function range(start, count, step){
		step = step || 1;
		if(count==null){
			count = start;
			start = 0;
		}
		var res = [];
		for(var i=start; count>0; i+=step,count--){
			res.push(i);
		}
		return res;
	}
		
	function compareVersions(v1, v2){
		if(v1==v2) return 0;
		v1 = v1.split(".");
		v2 = v2.split(".");
		for(var i=0; i<3; i++){
			var a = parseInt(v1[i], 10),
				b = parseInt(v2[i], 10);
			
			if(a<b) return -1;
			if(a>b) return 1;
		}
		return 0;
	}
	
	function version(num){
		if(!num) return topVersion;
		for(var k in interfaces){
			if(compareVersions(num, k)<=0){
				var $D = function(x){return JSQ(x);}
				extend($D, interfaces[k]);
				return $D;
			}
		}
		alert("JsonQuarry version "+num+" not supported");
	}
	
	const JsPath = (function(){
		function each(coll, F){
			if(typeof(coll.length)!="undefined")
				for(var i=0; i<coll.length; i++) F(coll[i], i, coll[i+1]);
			else
				for(var k in coll) F(coll[k], k);
		}
		
		function extend(o,s){for(var k in s) o[k] = s[k];}
		function getSteps(path){
			if(path==null) throw "Path or step of path is null";
			if(typeof(path)=="number") return path;
			
			if(path.constructor==Array){
				var res = [];
				each(path, function(s){
					var ss = getSteps(s);
					res = res.concat(ss);
				});
				return res;
			}
			if(typeof(path)=="string") return path.split("/");
			throw "Unknown path type";
		}
		function arrayMode(step){return typeof(step)=="number" || step.match(/^#(\d+)|(\*)/);}
		
		function pathToString(path){
			var sPath = getSteps(path);
			return sPath instanceof Array? sPath.join("/")
				:sPath.toString();
		}
		
		function pathMatch(p1, p2){
			p1 = getSteps(p1);
			p2 = getSteps(p2);
			for(var i=0; i<p1.length && i<p2.length; i++){
				if(p1[i]=="*") continue;
				if(p2[i]=="*") continue;
				if(p1[i]!=p2[i]) return false;
			}
			return true;
		}
		
		var handlers = {
			onchange:[],
			onmove:[],
			onremove:[]
		};
		
		return {
			set: function(obj, path, val){
				if(path==null) throw "Path is null";
				var o = obj;
				var ss = getSteps(path);
				each(ss, function(s, i, next){
					if(s==null) throw "Step is null";
					else{
						var arrMode = arrayMode(s);
						var idx = arrMode?typeof(s)=="number"?s:parseInt(RegExp.$1):null;
						if(next==null){
							if(arrMode) o[idx] = val;
							else o[s] = val;
						}
						else{
							if(arrMode){
								if(typeof(o[idx])=="undefined")
									o[idx] = arrayMode(next)?[]:{};
								o = o[idx];
							}
							else{
								if(!o[s]) o[s] = arrayMode(next)?[]:{};
								o = o[s];
							}
							if(next=="#*"){
								o.push(val);
							}
						}
					}
				});
				each(handlers.onchange, function(hnd){
					if(pathMatch(path, hnd.path))
						hnd.handler(obj, path, val);
				});
				return obj;
			},
			
			get: function(obj, path){
				if(path==null) throw "Path is null";
				var o = obj;
				if(o==null) return null;
				each(getSteps(path), function(s){
					if(s==null) throw "Step is null";
					if(o==null) return;
					if(arrayMode(s)){
						o = o[parseInt(RegExp.$1)];
					}
					else o = o[s];
				});
				return o;
			},
			
			delItem: function(obj, path){
				var elPath = getSteps(path);
				var collPath = elPath.splice(0, elPath.length-1);
				elPath = elPath.join("");
				var coll = JsPath.get(obj, collPath);
				if(coll instanceof Array)
					coll.splice(parseInt(elPath.match(/\d+/)),1);
				else{
					var newC = {};
					for(var k in coll){
						if(k!=elPath) newC[k] = coll[k];
					}
					JsPath.set(obj, collPath, newC);
				}
				each(handlers.onremove, function(hnd){
					if(pathMatch(path, hnd.path))
						hnd.handler(obj, path);
				});
			},
			
			push: function(obj, path, val){
				var arr = JsPath.get(obj, path);
				if(!arr || !(arr instanceof Array)){
					arr = [];
					JsPath.set(obj, path, arr);
				}
				arr.push(val);
			},
			
			remove: function(obj, path){JsPath.delItem(obj, path);},
			
			move: function(obj, path, up){
				var elPath = getSteps(path);
				var collPath = elPath.splice(0, elPath.length-1);
				elPath = elPath.join("");
				var coll = JsPath.get(obj, collPath);
				if(coll instanceof Array){
					var idx = parseInt(elPath.match(/\d+/));
					if(idx==0 && up) throw "Can't move first element up.";
					if(idx==coll.length-1 && !up) throw "Can't move last element down.";
					var el = coll[idx];
					coll.splice(idx,1);
					coll.splice(up?idx-1:idx+1, 0, el);
					
					each(handlers.onmove, function(hnd){
						if(pathMatch(path, hnd.path))
							hnd.handler(obj, path, up);
					});
				}
				else
					throw "Moving object attribute is meaningless";
			},
			
			moveUp: function(obj, path){JsPath.move(obj, path, true);},
			moveDown: function(obj, path){JsPath.move(obj, path, false);},
			onchange:{
				bind: function(path, handler){
					handlers.onchange.push({path:pathToString(path), handler:handler});
					return handlers.onchange.length - 1;
				},
				reset: function(){handlers.onchange = [];},
				unbind: function(idx){handlers.onchange.splice(idx, 1);}
			},
			onmove:{
				bind: function(path, handler){
					handlers.onmove.push({path:pathToString(path), handler:handler});
					return handlers.onmove.length - 1;
				},
				reset: function(){handlers.onmove = [];},
				unbind: function(idx){handlers.onmove.splice(idx, 1);}
			},
			onremove:{
				bind: function(path, handler){
					handlers.onremove.push({path:pathToString(path), handler:handler});
					return handlers.onremove.length - 1;
				},
				reset: function(){handlers.onremove = [];},
				unbind: function(idx){handlers.onremove.splice(idx, 1);}
			}
		};
	})();
	
	var topVersion = "2.0.0";
	
	var intrf = {
		version: version,
		extend: extend,
		each: each,
		aggregate: aggregate,
		map: map,
		select: select,
		first: first,
		flat: flat,
		page: page,
		index: index,
		keys: keys,
		groupBy: groupBy,
		concat: concat,
		toArray: toArray,
		treeToArray: treeToArray,
		sort: sort,
		reverse: reverse,
		Dictionary: Dictionary,
		range: range,
		Path: JsPath
	};
	
	if(typeof(JSUnit)=="object") intrf.compareVersions = compareVersions;
	
	var interfaces = {};
	interfaces[topVersion] = intrf;
	
	extend(JSQ, intrf);
	
	return JSQ;
})();
