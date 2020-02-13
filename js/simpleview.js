import {$,$Q,$C,$H,$T,px,pc,css} from './core.js';
import {ThemeSelector} from './themeselector.js';
import {modalDialog, floatingDialog} from './controls.js';
import {content as HelpContent} from './help.js';

const head = $('head');
let title = head.find('title');
if(!title.length){
	title = $($C.html.title());
	head.append(title);
}

const version = '3.5.1';

let surfing = [];
let selectedItems = new Set();

const itemHash = decodeURI(document.location.hash).slice(1);

head.append($($C.html.style({id:'simpleViewBasicStyle'}, '/*simple view basic*/\n', $C.css.stylesheet({
	body:{
		fontFamily:'Verdana, Arial, Sans-Serif',
		' .link':{
			cursor:css.pointer,
			textDecoration:css.underline
		},
		' code':{
			fontFamily:'Courier New, Monospace',
			fontSize:px(18)
		},
		' .clickable':{
			cursor:css.pointer,
			':hover':{textDecoration:css.underline}
		},
		' .test':{
			fontFamily:'Courier New, Monospace',
			padding:px(3),
			color:'#008',
			backgroundColor:'#ff0'
		},
		' .itemRef':{
			cursor:css.pointer,
			':hover':{textDecoration:css.underline}
		},
		' .lnkQuery':{
			cursor:css.pointer
		},
		' .queryRef':{
			cursor:css.pointer,
			':hover':{
				textDecoration:css.underline,
				color:'#8fa'
			}
		},
		' .footer':{
			margin:px(10),
			padding:px(10),
			textAlign:css.center,
			fontSize:px(11),
			fontStyle:css.italic,
			borderTop:$T.border(1, '#ccc')
		},
		' .bibliography':{
			' ul':{
				margin:px(0),
				padding:px(0, 35)
			}
		},
		' .treeButton':{
			cursor:css.pointer,
			padding:px(1, 8),
			':hover':{
				color:'#4f4'
			}
		},
		' .relNet':{
			padding:px(5),
			margin:px(5),
			border:$T.border(1, '#ccc'),
			' ul':{
				margin:px(2, 20),
				padding:px(2, 20),
				' li':{
					margin:px(0),
					padding:px(0),
					' .children':{
						display:css.none
					}
				}
			}
		},
		' #backLink':{
			cursor:css.pointer,
			fontSize:pc(50)
		},
		' #pnlMenu':{
			'float':css.right,
			margin:px(0, 5),
			' .link':{
				margin:px(0, 10)
			}
		},
		' h1':{
			margin:px(10, 10, 5, 10)
		},
		' .statistics':{
			margin:px(5, 10, 20, 10),
			//fontStyle:css.italic,
			fontSize:px(12)
		},
		' .mainTable':{
			' .relID':{color:'#aaa'},
			' .attributeID':{color:'#aaa'},
			' .pnlItem':{
				padding:px(3),
				margin:px(3),
				border:$T.border(1, '#ccc'),
				' .itemName':{
					fontWeight:css.bold
				},
				' .itemID':{
					fontSize:pc(70),
					color:'#ccc'
				},
				' .description':{
					fontSize:pc(80),
					margin:px(8, 40),
					' .itemRef':{
						textDecoration:css.underline
					}
				},
				' .itemDocs':{
					margin:px(3), 
					padding:px(3, 40)
				},
				' .relationsList':{
					margin:px(3, 20)
				}
			}
		},
		' .nacreModalDialog':{
			' .description':{
				fontSize:pc(90),
				margin:px(8, 40),
				' .itemRef':{
					textDecoration:css.underline
				}
			}
		},
		' .relationsTree':{
			margin:px(10)
		},
		' .relatedItems':{
			margin:px(10),
			' ol':{
				margin:px(0, 20)
			}
		},
		' .relName':{
			color:'#02a',
			fontWeight:css.bold
		}
	},
	'#dlgItem':{
		' .attributesTable':{
			fontSize:px(12),
			' .prmName':{
				fontWeight:css.bold
			}
		},
		' .dlgBody':{
			width:px(900)
		},
		' .dlgContent':{
			' .btShowSelected':{
				'float':css.right,
				display:css.none,
			},
			' .attrView':{
				margin:px(8),
				fontSize:pc(80),
				color:'#ccc'
			}
		}
	},
	'#pnlTheme':{
		'float':css.right,
		marginRight:px(30)
	},
	' #dlgHelp':{
		' .dlgBody':{
			width:px(900)
		}
	},
	' .dlgCustomQuery':{
		' .dlgContent':{
			// width:px(800),
			minHeight:px(400)
		},
		' .tbHeaders':{width:px(700)},
		' textarea':{
			minWidth:px(800),
			minHeight:px(50)
		},
		' .queryButtons':{
			textAlign:css.right
		},
		' .pnlQueryOut':{
			
		}
	}
}))));

const themeSelector = ThemeSelector({
	light:{},
	dark:{
		body:{
			backgroundColor:'#012',
			color:'#ffe',
			' .mainTable':{
				' .pnlItem':{
					borderColor:'#553'
				},
				' .relID':{
					color:'#ba8'
				}
			},
			' .error':{
				backgroundColor:'#ff0',
				color:'#f00',
				padding:px(5),
				margin:px(10),
				border:$T.border(1, '#f00')
			},
			' .relName':{
				color:'#79a'
			},
			' .itemRef':{
				':hover':{color:'#8fa'}
			},
			' .nacreModalDialog':{
				' .dlgBody':{
					backgroundColor:'#024',
					color:'#eee'
				}
			},
			' .nacreFloatingDialog':{
				backgroundColor:'#024',
				color:'#eee'
			}
		},
		'a':{
			':link':{color:'#afc'},
			':visited':{color:'#afc'},
			':hover':{color:'#0f0'},
		}
	}
});

function itemRelations(kb, itm, itmID, clickableRelations){
	const{markup,apply,div,span,p} = $H;
	function attrView(r){
		const {markup,apply,div,span}=$H;
		return markup(
			r.weight?` (${r.weight})`:null,
			r.attributes?span({'class':'attrView'},
				'{',
				apply(r.attributes, (v,id)=>span(
					kb.getAttributeName(id), ': ', v
				), ', '),
				'}'
			):null
		);
	}

	const rbs = kb.relationsBySource[itmID];
	const rbt = kb.relationsByTarget[itmID];
	const relList = {};
	for(let rn in rbs){
		for(let r of rbs[rn])
			$Q.Path.push(relList, rn, {itemID:r.trg, rel:r});
	}
	for(let rn in rbt){
		for(let r of rbt[rn])
			$Q.Path.push(relList, rn, {itemID:r.src, rel:r});
	}

	return div({'class':'relationsList'},
		apply(relList, (items, rnm)=>span(
			span({'class':'relName'}, rnm), ' ',
			apply(items, itm=>span(
				span({'class':'itemRef', 'data-target':itm.itemID},
					itm.rel.reason?{title:'Reason: '+itm.rel.reason}:null,
					kb.getItemName(itm.itemID),
					attrView(itm.rel)
				)
			), ', ')
		), '; ')
	);
}

function itemDocs(itm){
	const{markup,apply,div,span,ul,li,a}=$H;
	return itm.docs&&itm.docs.length?div({'class':'bibliography'},
		div('Литература'),
		ul({'class':'itemDocs'},
			apply(itm.docs, (doc,idx)=>doc?typeof(doc)==='string'?li(doc)
				:li(
					`[${idx+1}] `,
					a({href:doc.url, target:'_blank'}, doc.title),
					doc.description?span({'class':'description'},
						doc.description instanceof Array?apply(doc.description, d=>div(d))
							:doc.description
					):null
				):null)
		)
	):null;
}

function itemQueries(itm, kb){
	const{apply,div,span,ul,li,a}=$H;
	if(!itm.queries) return;
	const queries = typeof(itm.queries)==='string'?itm.queries.split(';'):itm.queries;
	
	return queries.length?div(
		'Queries: ',
		apply(queries, q=>span(
			{'class':'queryRef', 'data-query':q},
			kb.queries[q].name
		), '; ')
	):null;
}

function mainTable(kb, searchString){
	const{markup,apply,div,span,p,ul,li} = $H;
	const items = kb.searchItems(searchString);

	return div({'class':'mainTable'},
		apply(items, (itm,id)=>div({'class':'pnlItem'},
			span({'class':'itemName itemRef', 'data-target':id}, itm.name || id),
			itm.name?' '+span({'class':'itemID', title:'item ID'}, `[${id}]`):null,
			itemRelations(kb, itm, id)
			// itm.description?div({'class':'description'},
			// 	itm.description instanceof Array?apply(itm.description, d=>div(d)):itm.description
			// ):null,
			// itemDocs(itm)
		)),
		div(
			p('Классы отношений: '),
			apply(kb.relationTypes, r=>div(
				span({'class':'relID'}, `[${r.id}] `),
				span({'class':'relName'}, r.name), ' / ',
				span({'class':'relName'}, r.inversion), 
				': ', r.description
			))
		),
		kb.attributeNames?div(
			//console.log(kb.attributeNames),
			p('Имена атрибутов:'),
			ul(apply(kb.attributeNames, (n,k)=>li(
				span({'class':'attributeID'}, `[${k}]`), ': ', n
			)))
		):null
	);
}

function relatedItems(kb, itmID){
	const{markup,apply,div,span,button,ol,ul,li}=$H;
	const items = kb.getRelatedItems(itmID);
	//console.log('related: %o', items);
	return div({'class':'relatedItems'},
		div('Related items:'),
		ol(
			apply(items, layer=>layer.length?li(
				apply(layer, itm=>span({'class':'itemRef', 'data-target':itm},
					kb.getItemName(itm)
				), ', ')
			):null)
		)
	);
}

const relationsNet = (function(){
	const{markup,apply,div,span,button,ul,li}=$H;

	let dlgItemID;

	function relList(kb, itmID, parentID){
		const relOut = $Q(kb.relationsBySource[itmID]).toArray().flat().raw();
		const relIn = $Q(kb.relationsByTarget[itmID]).toArray().flat().raw();

		function relTpl(rev){
			return function(r){
				const id = r[rev?'src':'trg'],
					relID = r[rev?'rev':'rel'];
				return ((relID==r.rel || relID==r.rev) && parentID==id)?null:li( // запрещаем отображать инверсию этого же отношения
					span({'class':'relName'}, relID), ' ',
					selectionControl(id),
					span({'class':'itemRef', 'data-target':id},
						r.reason?{title:'Reason: '+r.reason}:null,
						kb.getItemName(id)
					),
					r.attributes?span({'class':'attrView'}, '{', 
						apply(r.attributes, (v,nm)=>span(
							kb.getAttributeName(nm), ': ', v
						), ', '),
					'}'):null,
					span({
						'class':'treeButton btExpand',
						title:'Развернуть',
						'data-id':id,
						'data-parent':itmID
					}, '[+]'),
					span({'class':'treeButton btHide', title:'Скрыть'}, '[x]'),
					div({'class':'children'})
				);
			}
		}
		return ul(
			apply(relOut, relTpl(false)),
			apply(relIn, relTpl(true))
		);
	}

	return {
		template(kb, itmID){
			dlgItemID = itmID;
			return div({'class':'relNet'},
				// div('Relations net:'),
				div(
					span({'class':'itemRef', 'data-target':itmID}, kb.getItemName(itmID)),
					span({'class':'treeButton btShowAll', style:'display:none;', title:'Показать все'}, '[*]')
				),
				relList(kb, itmID)
			);
		},
		initButtons(kb, pnl){
			function expandLevel(bt){
				const chPnl = bt.parent().find('.children');
				if(chPnl.is(':visible')){
					chPnl.hide();
					bt.html('[+]');
					bt.attr({title:'Развернуть'});
				}
				else{
					const id = bt.attr('data-id');
					const prtID = bt.attr('data-parent');
					chPnl.html(relList(kb, id, prtID));
					bt.html('[-]');
					bt.attr({title:'Свернуть'});
					relationsNet.initButtons(kb, chPnl);
					chPnl
						.show()
						.find('.itemRef').click(function(){
							showItem(this, kb, dlgItemID);
						}).end()
					;
					selectionControl.initControls(chPnl);
				}
			}
			$(pnl)
				.find('.treeButton.btExpand').click(function(){expandLevel($(this));}).end()
				.find('.treeButton.btHide').click(function(){
					$(this).parent().hide();
					$(pnl).find('.btShowAll').show();
				}).end()
				.find('.treeButton.btShowAll').click(function(){
					$(this).parent().parent().find('li').show();
					$(pnl).find('.btShowAll').hide();
				}).end()
			;
		}
	};
})();

function attributesTable(kb, itm){
	const {markup,apply,div,span,ul,li} = $H;

	return itm.attributes?div({'class':'attributesTable'},
		ul(apply(itm.attributes, (v,k)=>li(
			span({'class':'prmName'}, 
				kb.getAttributeName(k)
			), ': ', v
		)))
	):null;
}

const selectionControl = (function(){
	const titles = new Map([
		[true, 'Исключить из сравнения'],
		[false, 'Добавить к сравнению']
	]);
	function template(itmID){
		const {markup,input}=$H;
		return markup(
			input({'type':'checkbox', 'class':'cbAddToSelection', 'data-id':itmID},
				{title:titles.get(selectedItems.has(itmID))},
				selectedItems.has(itmID)?{checked:true}:null
			)
		);
	}
	template.initControls = function(pnl){
		function selectItem(cb){
			const checked = cb.prop('checked');
			const itmID = cb.attr('data-id');
			selectedItems[checked?'add':'delete'](itmID);
			cb.attr({title:titles.get(checked)});
			const count = selectedItems.size;
			$('.btShowSelectedItems')[count?'show':'hide']();
			$('#dlgItem .btShowSelected')[count?'show':'hide']();
		}
		$(pnl)
			.find('.cbAddToSelection')
				.click(function(){
					const cb = $(this);
					selectItem(cb);
				})
				.mouseover(function(ev){
					if(ev.originalEvent.ctrlKey){
						const cb = $(this);
						cb.prop({checked:!ev.originalEvent.shiftKey});
						selectItem(cb);
					}
				})
			.end()
			.find('.itemRef').mouseover(function(ev){
				if(ev.originalEvent.ctrlKey){
					const cb = $(this).parent().find('.cbAddToSelection');
					cb.prop({checked:!ev.originalEvent.shiftKey});
					selectItem(cb);
				}
				
			}).end()
		;
	}
	return template;
})();

function itemDescription(itm){
	const {apply,div,span,a} = $H;
	
	function getDoc(bookID){
		if(!itm.docs) return;
		for(let e,i=0; e=itm.docs[i],i<itm.docs.length; i++){
			if(e.id==bookID) return {
				idx:i+1,
				doc:e
			};
		}
	}

	const lines = (itm.description instanceof Array?itm.description:[itm.description])
		.map(d=>d
			.replace(/<ref\s+book="([^"]+)"\s*\/>/g, /*`[$1]`*/ (sMt, bookID)=>{
				const doc = getDoc(bookID);
				return span('[', a({
					href:doc.doc.url,
					title:doc.doc.title,
					target:'_blank'
				}, doc.idx), ']');
			})
			.replace(/<ref\s+item="([^"]+)"\s*\/>/g, (sMt, itmID)=>{
				return span({
					'class':'itemRef',
					'data-target':itmID
				}, itmID);
			})
		)
	;
	return div({'class':'description'},
		apply(lines, d=>div(d))
	);
}

function showItem(itemRef, kb, prevItmID){
	surfing.push(prevItmID);
	itemDialog(kb, $(itemRef).attr('data-target'));
}

function itemDialog(kb, itmID){
	const{markup,apply,div,span,button,ul,li}=$H;
	const itm = kb.items[itmID];
	if(!itm){
		console.error('Item "%s" not found', itmID);
		return;
	}
	modalDialog.open('dlgItem', dlg=>{
		dlg
			.find('.dlgTitle').html(markup(
				kb.getItemName(itmID),
				itm.name?` [${itmID}]`:'',
				selectionControl(itmID)
			)).end()
			.find('.dlgContent').html(markup(
				button({'class':'btShowSelected'},
					selectedItems.size?{style:'display:block'}:null,
					'Show selected items'
				),
				itemRelations(kb, itm, itmID, true),
				itm.description?itemDescription(itm):null,
				// itm.description?div({'class':'description'},
				// 	itm.description instanceof Array?apply(itm.description, d=>div(d)):itm.description
				// ):null,
				itemDocs(itm),
				itemQueries(itm, kb),
				attributesTable(kb, itm),
				div({'class':'relationsTree'}),
				relationsNet.template(kb, itmID),
				relatedItems(kb, itmID)
			)).end()
			.find('.btShowSelected').click(function(){
				comparisonDialog(kb);
			}).end()
			.find('.relNet').each((i,pnl)=>relationsNet.initButtons(kb, pnl)).end()
			.find('.itemRef').click(function(){
				showItem(this, kb, itmID);
			}).end()
			.find('.customButtons').html(markup(
				surfing.length?button({'class':'btBack'}, 'Назад'):null
			)).end()
			.find('.btBack').click(function(){
				itemDialog(kb, surfing.pop())
			}).end()
			.find('.queryRef').click(function(){
				const qID = $(this).attr('data-query');
				queryDialog(kb, qID);
				
			}).end()
			.find('.relName').click(function(){
				const relNm = $(this).html();
				const rev = $(this).hasClass('reversed');
				dlg
					.find('.relationsTree').html(ul(
						li(
							kb.getItemName(itmID), 
							relationsTree(kb, relNm, itmID, rev)
						)
					)).end()
					.find('.relationsTree .itemRef').click(function(){
						showItem(this, kb, itmID);
					}).end()
				;
				selectionControl.initControls(dlg);
			}).end()
		;
		selectionControl.initControls(dlg);
		document.location.hash = '#'+itmID;
	});
}

function relationsTree(kb, relName, rootID, reversed){
	const{markup,apply,div,span,ul,li}=$H;

	let tree = kb[reversed?'relationsByTarget':'relationsBySource'][rootID];
	// console.log('tree:%o', tree);
	if(!tree) return;
	tree = tree[relName];
	if(!(tree && tree.length)) return;
	tree = tree.map(x=>({nm:reversed?x.src:x.trg, weight:x.weight, reason:x.reason, attributes:x.attributes}));

	function attrView(rel){
		return rel.attributes?span({'class':'attrView'},
			'{',
			apply(rel.attributes, (v,id)=>span(
				kb.getAttributeName(id), ': ', v
			), ', '),
			'}'
		):null;
	}

	return markup(
		' ', 
		span({'class':'relName'}, relName), 
		ul(apply(tree, b=>li(
			selectionControl(b.nm),
			span({'class':'itemRef', 'data-target':b.nm}, 
				kb.getItemName(b.nm),
				b.weight?` (${b.weight})`:null,
				b.reason?{title:'Reason: '+b.reason}:null
			),
			attrView(b),
			relationsTree(kb, relName, b.nm, reversed)
		)))
	);
}

function numUnits(n, unit){
	return [n, n%100>1&&n%100<21? (unit+'s')
		:n%10==1?unit
		:(unit+'s')
	].join(' ');
}

function menuPanel(){
	const {div,span} = $H;
	return div({id:'pnlMenu'}, 
		span({'class':'link lnkCustomQuery'}, 'Query'),
		span({'class':'link lnkHelp'}, 'Help')
	);
}

function showHelp(){
	modalDialog.open('dlgHelp', dlg=>{
		// dlg.find('.dlgBody').css({width:px(900)});
		dlg.find('.dlgTitle').html('Краткая справка');
		dlg.find('.dlgContent').html(HelpContent);
	});
}

function customQuery(){
	const {markup,apply,textarea,div,span,button,input,table,tr,td,th} = $H;
	//modalDialog.open('dlgCustomQuery', dlg=>{
	floatingDialog.open('dlgCustomQuery', dlg=>{
		dlg
			.find('.dlgTitle').html('Конструктор запроса').end()
			.find('.dlgContent').html(markup(
				div(
					'Заголовки:',
					input({type:'text', 'class':'tbHeaders', value:'Item;Name'})
				),
				textarea({'class':'tbQuery'}, 'kb=>kb.itemsList\n\t.map(x=>([{itemRef:x.id}, x.name]))'),
				div({'class':'queryButtons'},
					button({'class':'btRun'}, 'Run')
				),
				div({'class':'pnlQueryOut'})
			)).end()
			.find('.btRun').click(function(){
				const query = dlg.find('.tbQuery').val();
				try{
					const ff = new Function(`return (${query})(KB.kb);`);
					const res = ff();
					const headers = dlg.find('.tbHeaders').val().split(';');
					//console.log('res: %o', res);
					dlg
						.find('.pnlQueryOut').html(markup(
							table({border:1, cellpadding:3, cellspacing:0},
								tr(apply(headers, h=>th(h))),
								apply(res, r=>tr(
									apply(r, c=>td(
										typeof(c)==='object' && c.itemRef?span({'class':'itemRef', 'data-target':c.itemRef}, KB.kb.getItemName(c.itemRef))
											:c
									))
								))
							)
						)).end()
						.find('.itemRef').click(function(){
							const trgID = $(this).attr('data-target');
							itemDialog(KB.kb, trgID);
						}).end()
					;
				}
				catch(err){
					//console.error('Query error: %o', err);
					dlg
						.find('.pnlQueryOut').html(markup(
							div({'class':'error'}, err.message)
						)).end()
					;
				}
			}).end()
		;
	});
}

function comparisonDialog(kb){
	const {markup,apply,div,span,button,table,tr,td,th}=$H;
	const dlg = modalDialog.open('dlgComparison', dlg=>{
		dlg
			.find('.dlgTitle').html('Сравнение выбранных объектов').end()
			.find('.dlgButtons .customButtons')
				.html(button({'class':'btClear'}, 'Очистить список'))
				.find('.btClear').click(function(){
					selectedItems.clear();
					dlg.hide();
					$('.btShowSelectedItems').hide();
					$('#dlgItem .btShowSelected').hide();
					$('.cbAddToSelection').prop('checked', false);
				}).end()
				.end()
		;
	});

	let hiddenColumns = new Set();
	let hiddenSrcRelations = new Set();
	let hiddenTrgRelations = new Set();

	function update(){
		let attributes = new Set();
		for(let id of selectedItems){
			let e = kb.items[id];
			if(e.attributes) for(let attID in e.attributes){
				attributes.add(attID);
			}
		}

		let srcRelations = new Set();
		let trgRelations = new Set();
		for(let id of selectedItems){
			if(kb.relationsBySource[id])
				Object.keys(kb.relationsBySource[id]).map(x=>srcRelations.add(x));
			if(kb.relationsByTarget[id])
				Object.keys(kb.relationsByTarget[id]).map(x=>trgRelations.add(x));
		}
		srcRelations = Array.from(srcRelations);
		trgRelations = Array.from(trgRelations).map(r=>(x=>({id:x.id, inversion:x.inversion}))(
			$Q(kb.relationTypes)
				.select(rt=>rt.inversion==r)
				.toArray()
				.raw()[0]
		));

		function relationAttrView(rel){
			const {markup,apply,div} = $H;
			return rel.attributes?markup(
				apply(rel.attributes, (v,nm)=>div(
					kb.getAttributeName(nm), ': ', v
				), '; ')
			):null;
		}

		attributes = Array.from(attributes);
		dlg
			.find('.dlgContent')
				.html(markup(table(
					{border:1, cellpadding:3, cellspacing:0},
					tr(
						th(
							(hiddenColumns.size>0
								|| hiddenSrcRelations.size>0
								|| hiddenTrgRelations.size>0
							)?button({'class':'btShowAllColumns', title:'Show all columns'}, '*'):null
						),
						th('Name'),
						apply(attributes, attID=>hiddenColumns.has(attID)?null:th(
							kb.getAttributeName(attID),
							button({'class':'btDelCol', title:'Delete column', 'data-col':attID}, 'X')
						)),
						apply(srcRelations, relID=>hiddenSrcRelations.has(relID)?null:th(
							relID, ' ',
							button({'class':'btDelSrcRel', title:'Delete column', 'data-rel':relID}, 'X')
						)),
						apply(trgRelations, r=>hiddenTrgRelations.has(r.id)?null:th(
							r.inversion, ' ',
							button({'class':'btDelTrgRel', title:'Delete column', 'data-rel':r.id}, 'X')
						))
					),
					apply(Array.from(selectedItems), itmID=>{
						const itm = kb.items[itmID];
						return tr(
							td(button({'class':'btDel', 'data-id':itmID, title:'Exclude item'}, 'X')),
							td(span({'class':'itemRef', 'data-target':itmID},
								kb.getItemName(itmID)
							)),
							apply(attributes, attID=>hiddenColumns.has(attID)?null:td(
								itm.attributes?itm.attributes[attID]:null
							)),
							apply(srcRelations, relID=>hiddenSrcRelations.has(relID)?null:td(
								apply(kb.relationsByID[relID], r=>r.src!=itmID?null:div(
									span({'class':'itemRef', 'data-target':r.trg},
										kb.getItemName(r.trg)
									),
									relationAttrView(r)
								))
							)),
							apply(trgRelations, rel=>hiddenTrgRelations.has(rel.id)?null:td(
								apply(kb.relationsByID[rel.id], r=>r.trg!=itmID?null:div(
									span({'class':'itemRef', 'data-target':r.src},
										kb.getItemName(r.src)
									),
									relationAttrView(r)
								))
							))
						);
					})
				)))
				.find('.btDelSrcRel').click(function(){
					hiddenSrcRelations.add($(this).attr('data-rel'));
					update();
				}).end()
				.find('.btDelTrgRel').click(function(){
					hiddenTrgRelations.add($(this).attr('data-rel'));
					update();
				}).end()
				.find('.btShowAllColumns').click(function(){
					hiddenColumns.clear();
					hiddenSrcRelations.clear();
					hiddenTrgRelations.clear();
					update();
				}).end()
				.find('.btDel').click(function(){
					const itmID = $(this).attr('data-id');
					selectedItems.delete(itmID);
					$('.cbAddToSelection[data-id='+itmID+']').prop('checked', false);
					update();
				}).end()
				.find('.btDelCol').click(function(){
					hiddenColumns.add($(this).attr('data-col'));
					update();
				}).end()
				.find('.itemRef').click(function(){
					itemDialog(kb, $(this).attr('data-target'));
				}).end()
				.end()
		;
	}

	update();
}

function SimpleView(kb){
	const {markup,apply,div,span,p,a,h1,input,ul,li,button} = $H;
	const stat = kb.getStatistics();
	title.html('Nacre: '+kb.name);
	$('body').html(markup(
		themeSelector.template(),
		menuPanel(),
		h1(
			span({id:'backLink', title:'К оглавлению'}, 'Nacre KB', ':'),
			' ',
			kb.name
		),
		div({'class':'statistics'},
			numUnits(stat.totalItems, 'item'), ', ',
			// numUnits(stat.rootItems, 'root'), ') ',
			numUnits(stat.totalRelations, 'relation') 
		),
		kb.queries&&Object.keys(kb.queries).length?div(
			div('Запросы:'),
			ul(apply(kb.queries, q=>li({'class':'lnkQuery', 'data-id':q.id}, q.name)))
		):null,
		kb.errors.length?div({'class':'error'},
			apply(kb.errors, e=>div(e))
		):null,
		div(
			'Search: ', input({type:'search', id:'tbSearch'}), ' ',
			button({'class':'btClearSearch', title:'Clear search'}, 'X'), ' ',
			button({'class':'btShowSelectedItems', style:'display:none'}, 'Show Selected Items')
		),
		div({id:'pnlContent'},
			mainTable(kb)
		),
		div({'class':'footer'},
			`Nacre Simple View v.${version} of KB v.${kb.version}`
		)
	));
	themeSelector.init();
	$('#tbSearch').keyup(function(){
		$('#pnlContent').html(mainTable(kb, $(this).val()));
		setMainTableHandlers(kb);
	});
	$('.btClearSearch').click(function(){
		$('#tbSearch').val('');
		$('#pnlContent').html(mainTable(kb));
		setMainTableHandlers(kb);
	}).end();
	$('#backLink').click(function(){
		document.location.href='..';
	});
	$('#pnlMenu .lnkHelp').click(showHelp).end();
	$('#pnlMenu .lnkCustomQuery').click(customQuery).end();
	$('.lnkQuery').click(function(){
		const id = $(this).attr('data-id');
		queryDialog(kb, id);
		// kb.queries[id].select(kb);
	});
	setMainTableHandlers(kb);
	$('.btShowSelectedItems').click(function(){
		comparisonDialog(kb);
	}).end();

	if(itemHash.length){
		itemDialog(kb, itemHash);
	}
}

function queryDialog(kb, id){
	const q = kb.queries[id];
	const {markup, apply, div, span, table, tr, th, td} = $H;
	modalDialog.open('dlgQuery', dlg=>{
		dlg.find('.dlgTitle').html(q.name);
		const res = q.select(kb);

		function itemTemplate(c){
			return typeof(c)!='object'?c
				:c.itemRef?span({'class':'itemRef', 'data-target':c.itemRef}, c.title || kb.getItemName(c.itemRef))
				:c instanceof Array?apply(c, c=>itemTemplate(c), ', ')
				:null
			;
		}

		dlg.find('.dlgContent')
			.html(markup(
				res.type=='table'?table({cellpadding:3, cellspacing:0, border:1},
					res.headers?tr(apply(res.headers, h=>th(h))):null,
					apply(res.rows, r=>tr(
						apply(r, c=>td(
							itemTemplate(c)
						))
					))
				):null
			))
			.find('.itemRef').click(function(){
				itemDialog(kb, $(this).attr('data-target'));
			}).end()
		;
	});
}

function setMainTableHandlers(kb){
	$('.mainTable')
		.find('.itemRef').click(function(){
			surfing = [];
			itemDialog(kb, $(this).attr('data-target'));
		}).end()
	;
}

export {SimpleView};
