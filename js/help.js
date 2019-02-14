import {$, $C, $H, px, pc, css} from './core.js';
import {KB} from './kb.js';

const {markup, apply, h1, h2, p, div, span} = $H;

$('head').append($($C.html.style({id:'helpStyles'}, '/*help styles*/', $C.css.stylesheet({
	'#dlgHelp':{
		' .code':{
			fontFamily:'Courier new, Monospace',
			whiteSpace:'pre'
		},
		' .paramType':{
			color:'#888',
			fontSize:pc(80)
		},
		' .description':{
			color:'#ccc',
			margin:0
		}
	}
}))));

function kbMethods(defs){
	const {markup,apply,div,span,ul,li} = $H;
	const kb = KB({
		items:[]
	});
	//console.log(kb);
	const description = (module, dsc)=>div(ul(
		apply(Object.keys(module), nm=>li(
			//span(typeof(module[nm])), ' ',
			span({'class':'paramType'},
				(f=>typeof(f)=='function'?'Function':
					f instanceof Array?'Array':
					typeof(f)=='object'?'Object':
					''
				)(module[nm])
			), ' ',
			nm,
			(d=>d?markup(
					' - ', span({'class':'description'}, (d.description || d)),
					d.children?description(module[nm], d.children):null
				)
				:span({'class':'error'}, 'MISSING DESCRIPTION')
			)(dsc[nm])
		))
	));

	return description(kb, defs);
}

export const content = div({id:'helpcontent'},
	h1('UI'),
	h2('Выбор сущностей для сравнения'),
	p('В диалоге сущности имеются чекбоксы для выбора нескольких сущностей с целью их сравнения.'),
	p('Чтобы было удобно выбирать большое количество сущностей, можно просто провести по соответствующим чекбоксам мышкой (без кликов) при нажатой клавише "Ctrl", и все эти чекбоксы станут выделенными. Если требуется сбросить выделение на нескольких чекбоксах, можно аналогичным образом провести по ним мышкой при нажатых клавишах "Ctrl" и "Shift".'),
	h1('Синтаксис'),
	p('Структура базы знаний:'),
	div({'class':'code'}, `
		simpleview(kb({
			name:'mykb',
			relationtypes:[ /* relation type definitions */ ],
			queries:[/* queries list */],
			articles:[ /* article definitions */ ],
			rules:[/* rules definitions */],
			conditions:[/* condition definitions */],
			items:[ /* items data */ ]
		}))
	`),
	p('Relation type definition example:'),
	div({'class':'code'},
		`{id:'workson', name:'работает на', inversion:'платформа для', symmetric:false /*необязательно*/, transitive:false /*необязательно*/, description:'обозначает платформу для по', conditions:kb=>{/*...some checks...*/}}`
	),
	p('Article definition example:'),
	div({'class':'code'},
		`{id:'mobilenet', url:'https://www.npmjs.com/mobilenet', title:'mobilenet'}`
	),
	p('Item data example:'),
	div({'class':'code'},`
		{id:'model', relations:{is:'basicnotion', intendedfor:'ml;dl'},
			conditions:kb=>{/*... some checks ...*/},
			description:'simple description', // or array of strings
			docs:[
				{url:'http://mysite.com', title:'small article'},
				{article:'bigarticle'} // ref to article defined in articles section
			]
		}
	`),
	p('При задании отношений можно указывать вес отношения в пределах от 0 до 1, например:'),
	div({'class':'code'}, `{id:'Python', relations:{is:'proglang;favorite(0.5)'}}`),
	p('При задании отношений можно указывать их атрибуты в формате JSON:'),
	div({'class':'code'}, `{id:'camera', relations:{soldIn:'megaShop{priceRub:10000}'}}`),
	p('Можно задавать обратные отношения, используя в их названии префикс "_", например:'),
	div({'class':'code'}, `{id:'proglang', relations:{_is:'Python'}}`),
	p('Отношения можно задавать в развернутом виде, например: '),
	div({'class':'code'}, `
		{id:'cheapCamera', 
			relations:{
				is:'genericCamera',
				soldIn:{trg:'megaShop', attributes:{priceRub:9000}}
			}
		}
	`),
	p('Или, если отношений одного типа несколько, их можно задать в виде массива:'),
	div({'class':'code'}, `
		{id:'superCamera', relations:{
			is:'genericCamera',
			soldIn:[
				{trg:'smallShop', attributes:{
					priceRub:12000
				}},
				{trg:'megaShop', attributes:{
					priceRub:10000
				}}
			]
		}}
	`),
	p('Описание сущности формируется в атрибуте <code>description</code>. Это может быть либо просто строка, либо массив строк (каждая строка массива формирует новый абзац текста). Для форматирования текста можно использовать простые HTML-теги, отражающие семантику текста.'),
	p('Для задания ссылок на литературу следует внутри строки использовать тег <code>&lt;ref&nbsp;book="myBookID"/&gt;</code>. Идентификатор книги задается атрибутом <code>id</code> в ее описании.'),


	h2('Запросы'),
	p('Запросы позволяют создавать специальные представления данных, отвечающих заданным критериям.'),
	p('Пример определения запроса:'),
	div({'class':'code'}, `
		{id:'workingItems', name:'Working Items', select:kb=>{/* ... */ return {type:'table', headers:['ID', 'Name'], rows:res};}}
	`),
	p('Атрибут "rows" содержит массив данных для строк таблицы. Каждая строка - массив колонок. Если колонка содержит массив значений, они отображаются в виде списка через запятую. Если колонка должна содержать ссылку на сущность, она должна иметь вид объекта с атрибутом "itemRef", содержащим идентификатор целевой сущности, а также необязательный атрибут "title", содержащий отображаемое имя сущности.'),

	h2('Свойства и методы модуля KB'),
	kbMethods({
		'version':'Номер текущей версии модуля',
		'name':'Имя текущей базы знаний',
		'items':'Словарь сущностей базы знаний',
		'itemsList':'Список сущностей базы знаний',
		'queries':'Словарь запросов базы знаний',
		'getItem':'Возвращает сущность по идентификатору',
		'getItemName':'Возвращает имя сущности (если задано) по идентификатору',
		'getRelatedItems':'Возвращает по идентификатору сущности список ближайших связанных с ней сущностей, сгруппированных по расстоянию',
		'relationsByTarget':'Словарь отношений, сгруппированных по идентификатору целевой сущности',
		'relationsBySource':'Словарь отношений, сгруппированных по идентификатору исходной сущности',
		'relationsByID':'Словарь отношений, сгруппированных по идентификатору отношения',
		'relationTypes':'Словарь определений типов отношений',
		'attributeNames':'Словарь имен атрибутов',
		'isRelated':'Получает идентификаторы исходной сущности, отношения, и целевой сущности, возвращает true, если исходная и целевая сущности связаны заданным отношением. Учитывается транзитивность отношений.',
		'setRelation':'Устанавливает отношение заданного типа между двумя сущностями. Получает идентификатор первой сущности, идентификатор типа отношения, и идентификатор второй сущности.',
		'relations':'Коллекция всех отношений',
		'forAny':'Получает имя класса, и функцию. Выполняет функцию для каждой сущности, связанной отношением "is" с указанным классом',
		'searchItems':'Возвращает результат поиска сущностей по заданной строке поиска',
		'getAttributeName':'Возвращает имя атрибута, заданного идентификатором',
		'getStatistics':'Возвращает статистику по сущностями и отношениям базы знаний',
		restriction:{description:'Модуль, содержащий методы проверки сущностей и отношений', children:{
			relationTarget:'Проверяет отношение на соответствие типа целевой сущности. Аргументы: идентификатор отношения и массив (или строка, разделенная точкой с запятой) идентификаторов целевых сущностей (требуется совпадение одного из них).',
			relationSource:'Проверяет отношение на соответствие типа исходной сущности. Аргументы: идентификатор отношения и массив (или строка, разделенная точкой с запятой) идентификаторов исходных сущностей (требуется совпадение одного из них).',
			itemAttributeRequired:'Проверяет наличие заданного атрибута у сущностей, наследованных от заданной. Аргументы: идентификатор базовой сущности, имя атрибута.',
			itemRelationRequired:'Проверяет наличие заданного отношения у сущностей, наследованных от заданной. Аргументы: идентификатор базовой сущности, идентификатор отношения.'
		}},
		'errors':'Список ошибок, обнаруженных в базе знаний'
	}),
	h2('Пользовательские запросы'),
	p('Самый простой способ выполнить запрос к базе знаний - использовать консоль браузера. API базы знаний доступен через объект <span class="code">KB.kb</span>.'),
	p('Другой способ - использовать диалог "Конструктор запроса" (открывается через ссылку "Query" в верхнем меню. Запрос формируется в виде функции, возвращающей двумерный массив значений, отображаемый в виде таблицы. Для размещения в таблице ссылки на сущность необходимо поместить в ячейку объект вида <code>{itemRef:"item-id"}</code>.')
);
