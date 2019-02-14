import {$Q} from './core.js';

const version = '3.3.0';

const standardRelationDefs = [
	{id:'is', name:"is", inversion:"may be", transitive:true, description:"Устанавливает иерархию наследовани¤ классов сущностей"},
	{id:'instanceOf', name:"is instance of", inversion:"has instance", description:"Указывает, что данная сущность является зкземпляром заданного класса."},
	{id:'uses', name:"uses", inversion:"used by", transitive:true, description:"Обозначает использование одной сущности другой"},
	{id:'includes', name:"includes", inversion:"included by", transitive:true, description:"Обозначает включение одной сущности в другую"},
	{id:'like', name:"like", inversion:"like", symmetric:true, transitive:true, description:"Обозначает некоторое сходство между сущностями"},
	{id:'comesFrom', name:"comes from", inversion:"predecessor of", transitive:true, description:"Указывает на происхождение сущности (в историческом аспекте)."},
	{id:'intendedFor', name:"предназначен для", inversion:"обеспечивается", description:"Указывает на предназначение сущности."},
	{id:'refTo', name:"referedTo", inversion:"referedBy", description:"Указывает связь (обобщенную) сущностей"}
];

function KB(data){

	// console.log('items: %o', data.items);
	const errors = [];

	// const standardRelations = $Q(standardRelationDefs).index(x=>x.id).raw();
	// console.log('standardRelations: %o', standardRelations);

	if(!data.conditions) data.conditions = [];

	const relationTypes = {};

	function addRelTypes(relTypes){
		if(!relTypes) return;
		for(let rel of relTypes){
			if(relationTypes[rel.id]) errors.push('Duplicate relation type ID: '+rel.id);
			relationTypes[rel.id] = rel;
			if(rel.conditions){
				data.conditions.push({
					id:rel.id+'_condition',
					check:rel.conditions
				});
			}
		}
	}



	addRelTypes(standardRelationDefs);
	addRelTypes(data.relationTypes);

	const queries = $Q.index(data.queries, q=>q.id);

	function prepareDocs(){
		data.articles = $Q.index(data.articles, x=>x.id);
		for(let itm of data.items){
			if(itm.docs) itm.docs = itm.docs.map(
				d=>d.article?data.articles[d.article]||(errors.push(`Article "${d.article}" not found`), null)
					:d.url?d
					:typeof(d)==='string'?d
					:(errors.push('Bad bibliography reference: "'+JSON.stringify(d)+'"'),d)
			);
		}
	}

	prepareDocs();

	if(data.items instanceof Array){
		const duplicateIDs = $Q(data.items).groupBy('id').map(x=>({n:x.length,id:x[0].id})).select(x=>x.n>1).keys().raw();
		if(duplicateIDs.length>0) errors.push('Duplicate item IDs found: '+duplicateIDs.join(', '));
		data.items = $Q(data.items).index(x=>x.id).raw();
	}

	for(let id in data.items){
		let itm = data.items[id];
		if(itm.conditions){
			data.conditions.push({
				id:id+'_item_condition',
				check:itm.conditions
			});
		}
	}

	function checkAttributeNames(){
		if(data.paramNames) errors.push('Obsolete KB format: use "attributeNames" instead of "paramNames" in KB declaration.');
		for(let id in data.items){
			let itm = data.items[id];
			if(itm.params) errors.push('Obsolete KB format: use "attributes" instead of "params" in item definitions.');
			if(itm.attributes){
				for(let k in itm.attributes){
					if(!data.attributeNames[k]) errors.push(`Attribute name "${k}" of object "${id}" not defined`);
				}
			}
		}
	}

	checkAttributeNames();

	const checkRelationDuplicate = (function(){
		// TODO: Если когда либо отношения будут формироваться автоматически, 
		// то для таких отношений надо будет просто игнорировать дубликаты
		const rels = {};
		return function(rel){
			const tag = [rel.src, rel.trg, rel.rel].join(':');
			if(rels[tag]){
				errors.push(`Duplicate relation "${rel.rel}" from "${rel.src}" to "${rel.trg}".`);
				return false;
			}
			rels[tag] = true;
			return true; // i.e. SUCCESS
		}
	})();

	function unsafeJsonParse(json){
		const f = new Function('return '+json);
		return f();
	}

	const relations = [];
	$Q.each(data.items, (itm,itmID)=>{
		if(!itm.relations) return;
		$Q.each(itm.relations, (ri,id)=>{
			const reverse = id[0]=='_';
			if(reverse) id = id.slice(1);

			if(typeof(ri)==='string'){
				const rels = ri.split(';');
				$Q.each(rels, trg=>{
					const mtWeight = trg.match(/([^\(]+)\s*\(((0\.)?[0-9]+)\)/i);
					const mtAttr = trg.match(/([^\{]+)+\s*(\{[^\}]+\})/i);
					const trgID = mtWeight?mtWeight[1]
							:mtAttr?mtAttr[1]
							:trg;
					const rel = {
						src: reverse?trgID:itmID,
						trg: reverse?itmID:trgID,
						rel: id
					};
					if(mtWeight) rel.weight = parseFloat(mtWeight[2]);
					if(mtAttr){
						const json = mtAttr[2];
						try{
							//const attr = JSON.parse(json);
							const attr = unsafeJsonParse(json);
							rel.attributes = {};
							for(let k in attr){
								if(!data.attributeNames[k]) errors.push(`Attribute name "${k}" of some relation not defined`);
								rel.attributes[k] = attr[k];
							}
						}
						catch(e){
							errors.push(`Bad relation attributes: "${json}"`);
						}
					}
					if(checkRelationDuplicate(rel)){
						if(trg&&trg.length) relations.push(rel);
					}
				});
			}
			else if(ri instanceof Array){
				for(let rr of ri){
					rr.src = itmID;
					rr.rel = id;
					// console.log('rr: %o', rr);
					if(checkRelationDuplicate(rr)) relations.push(rr);
				}
			}
			else if(typeof(ri)==='object'){
				ri.src = itmID;
				ri.rel = id;
				// console.log('ri: %o', ri);
				if(checkRelationDuplicate(ri)) relations.push(ri);
			}
			else{
				errors.push(`Bad relations definition: "${ri}"`);
			}
		});
	});
	// console.log(relations);
	for(let rel of relations){
		const relDef = relationTypes[rel.rel];
		if(relDef) rel.rev = relDef.inversion;
			else errors.push('Undefined relation type: '+rel.rel);
		if(!data.items[rel.src]) errors.push('Relation source does not exist: '+rel.src);
		if(!data.items[rel.trg]) errors.push('Relation target does not exist: '+rel.trg);
	}

	const relationsByTarget = $Q(relations)
		.groupBy(x=>x.trg)
		.map(r=>$Q(r).groupBy(x=>x.rev).raw())
		.raw()
	;

	const relationsBySource = $Q(relations)
		.groupBy(x=>x.src)
		.map(r=>$Q(r).groupBy(x=>x.rel).raw())
		.raw()
	;
	
	const relationsByID = $Q(relations).groupBy(x=>x.rel).raw();

	for(let id in data.items){
		// if(!data.items[id].isRoot && !relationsByTarget[id] && !relationsBySource[id])
		if(!relationsByTarget[id] && !relationsBySource[id])
			errors.push(`Item ${id} has no relations`);
	}

	function getRelatedItems(itmID){
		const layersCount = 5;
		let prevLayer = firstRelationLayer(itmID);
		const res = [prevLayer];
		let foundItems = prevLayer.map(x=>x);
		foundItems.push(itmID);
		for(let i=1; i<layersCount; i++){
			const newLayer = relationLayer(prevLayer)
				.filter(x=>!foundItems.includes(x))
			;
			foundItems = foundItems.concat(newLayer);
			prevLayer = newLayer;
			res.push(newLayer);
		}
		return res;
	}

	function firstRelationLayer(itmID){
		let res = [];
		$Q(relationsByTarget[itmID]).each(r=>{
			res = res.concat(r.map(x=>x.src))
		});
		$Q(relationsBySource[itmID]).each(r=>{
			res = res.concat(r.map(x=>x.trg))
		});
		return $Q(res).index(x=>x).keys().raw();
	}

	function isRelated(itm, relID, trg){
		const rel = relationTypes[relID];
		const w = relationWeight(itm, relID, trg);
		const res = w=> w===1?true:w===0?false:w;
		if(!rel.symmetric) return res(w);

		const w2 = relationWeight(trg, relID, itm);
		return res(Math.max(w, w2));
	}

	function relationWeight(itm, relID, trg, totalWeight=1){
		const rel = relationTypes[relID];
		const rels = relationsBySource[itm];
		if(!rels) return 0;
		const related = rels[relID];

		if(!related) return 0;
		const filtered = related.filter(x=>x.trg==trg);
		if(filtered.length>0){
			const r = filtered[0];
			const w = isNaN(r.weight)?1:r.weight;
			return totalWeight * w;
		}
		if(rel.transitive){
			for(let e,i=0; e=related[i],i<related.length; i++){
				return relationWeight(e.trg, relID, trg, e.weight);
			}
			return 0;
		}
	}

	function relationLayer(items){
		let res = [];
		$Q.each(items, itm=>{
			res = res.concat(firstRelationLayer(itm))
		});
		return $Q(res).index(x=>x).keys().raw();
	}

	// console.log('relations:%o', relations);
	// console.log('relationsByTarget:%o', relationsByTarget);

	function searchItems(searchString){
		// console.log('Searching for "%s"', searchString);
		if(false){ // regex mode
			let re = /./i;
			try{re = new RegExp(searchString, 'i');}catch(e){}
			return $Q(data.items)
				.select(x=>re.test(x.name) || re.test(x.id))
				.raw();
		}
		else{ // text mode
			const ss = searchString?searchString.toLowerCase():'';
			return $Q(data.items)
				.select(x=>(ss==null || ss.length==0) 
					|| (x.name&&x.name.toLowerCase().indexOf(ss)>=0) 
					|| (x.id&&x.id.toLowerCase().indexOf(ss)>=0))
				.raw();
		}
	}

	function getAttributeName(attrID){
		if(!data.attributeNames) return attrID;
		return (x=>x||attrID)(data.attributeNames[attrID]);
	}

	function getStatistics(){
		return {
			totalItems:Object.keys(data.items).length,
			// rootItems:Object.keys(data.items).map(id=>data.items[id]).filter(o=>o.isRoot).length,
			totalRelations:relations.length
		}
	}

	const getItem = id=>data.items[id];

	function forAny(className, action){ // executes action for each instance of given class defined by relation 'is'
		let rels = relationsByTarget[className];
		if(!rels) return;
		rels = rels['may be'];
		if(!(rels&&rels.length)) return;
		rels.forEach(r=>{
			action(getItem(r.src));
		});
	}

	function setRelation(src, relTypeID, trg, reason){
		if(!data.items[src]){
			errors.push('Relation source does not exist: '+ src);
			return;
		}
		if(!data.items[trg]){
			errors.push('Relation target does not exist: '+ trg);
			return;
		}
		const relType = relationTypes[relTypeID];
		if(!relType){
			errors.push('Relation type does not exist: '+relTypeID);
			return;
		}
		const rel = {
			src:src,
			trg:trg,
			rel:relTypeID
		};
		if(reason) rel.reason = reason;
		if(checkRelationDuplicate(rel)){
			relations.push(rel);
			$Q.Path.push(relationsByTarget, [trg, relType.inversion], rel);
			$Q.Path.push(relationsBySource, [src, relType.id], rel);
			$Q.Path.push(relationsByID, [relType.id], rel);
		}
	}

	const restriction = {
		relationTarget(relID, trgIDs){
			if(!(trgIDs instanceof Array)) trgIDs = trgIDs.split(';');
			const rels = relationsByID[relID];
			if(!rels) return;
			for(let r of rels){
				let found = false;
				for(let trgID of trgIDs){
					if(isRelated(r.trg, 'is', trgID)){
						found = true;
						break;
					}
				}
				if(!found)
					errors.push(`Relation "${relID}" requires ${trgIDs.map(x=>`"${x}"`).join(' or ')} target, but "${r.trg}" is given.`);
			}
		},
		relationSource(relID, srcIDs){
			if(!(srcIDs instanceof Array)) srcIDs = srcIDs.split(';');
			const rels = relationsByID[relID];
			if(!rels) return;
			for(let r of rels){
				let found = false;
				for(let srcID of srcIDs){
					if(isRelated(r.src, 'is', srcID)){
						found = true;
						break;
					}
				}
				if(!found)
					errors.push(`Relation "${relID}" requires ${srcIDs.map(x=>`"${x}"`).join(' or ')} source, but "${r.src}" is given.`);
			}
		},
		itemAttributeRequired(itmID, attrName){
			for(let id of Object.keys(data.items)){
				if(isRelated(id, 'is', itmID)){
					const itm = data.items[id];
					if(!(itm.attributes && itm.attributes[attrName])) 
						errors.push(`Attribute "${attrName}" required for item "${id}"`);
				}
			}
		},
		itemRelationRequired(itmID, relID){
			for(let id of Object.keys(data.items)){
				if(isRelated(id, 'is', itmID)){
					//const itm = data.items[id];
					const rels = new Set();
					const src = relationsBySource[id];
					if(src) Object.keys(src).map(r=>rels.add(r));
					const trg = relationsByTarget[id];
					if(trg) Object.keys(trg).map(r=>rels.add(r));
					if(!rels.has(relID)) 
						errors.push(`Relation of type "${relID}" required for item "${id}".`);
				}
			}
		}
	};

	const Interface = {
		version,
		name:data.name,
		items: data.items,
		itemsList: $Q.toArray(data.items),
		queries,
		getItem,
		getItemName: id=>{
			const itm = data.items[id];
			if(itm) return itm.name || id;
			return null;
		},
		getRelatedItems,
		relationsByTarget,
		relationsBySource,
		relationsByID,
		//standardRelations,
		relationTypes,
		attributeNames:data.attributeNames,
		isRelated,
		setRelation,
		get relations(){return relations;},
		forAny,
		searchItems,
		getAttributeName,
		getStatistics,
		restriction,
		errors
	};

	let rulesCycles = 0;

	function applyRules(){
		rulesCycles++;
		if(!(data.rules&&data.rules.length)) return;
		let applicationCount = 0;
		data.rules.forEach(r=>{
			const data = r.condition(Interface);
			if(data){
				applicationCount++;
				r.action(Interface, data, r);
			}
		});

		if(rulesCycles>=KB.maxRulesCycles){
			console.warn('Too many rules cycles');
			return;
		}

		if(applicationCount>0)
			applyRules();
	}
	applyRules();

	function checkConditions(){
		if(!data.conditions) return;
		data.conditions.forEach(cond=>cond.check(Interface));
	}
	checkConditions();

	KB.kb = Interface;

	// console.log(Interface);
	return Interface;
}

KB.maxRulesCycles = 1e3;

export {KB};
