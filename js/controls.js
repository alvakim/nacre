import {$,$C,$H,px,pc,css,$T} from './core.js';

const Color = {
	white: '#fff',
	black: '#000',
	lightGray: '#ccc',
	header:{
		back:'#008',
		text:'#efe'
	}
};

const settings = {
	floatingDialog:{
		width:400
	}
};

$('head').append($($C.html.style({id:'controlsBasicStyle'}, '/*controls basic*/\n', $C.css.stylesheet({
	'.nacreModalDialog':{
		position: css.fixed,
		top: 0, left:0,
		width:'100vw',
		height:'100vh',
		display: css.flex,
		alignItems: css.center,
		backgroundColor:'rgba(0, 0, 0, .7)',
		' .dlgBody':{
			margin: px(0, css.auto),
			backgroundColor: Color.white,
			border: $T.border(1, Color.lightGray),
			borderRadius: px(8),
			// width:px(600),
			// width:px(800),
			maxWidth:pc(90),
			// minWidth:px(600),
			' .dlgIcon':{
				'float':css.left,
				marginLeft:px(5)
			},
			' .dlgTitle':{
				fontWeight: css.bold,
				textAlign: css.center,
				padding: px(3),
				borderBottom: $T.border(1, Color.lightGray),
				borderTopLeftRadius:px(8),
				borderTopRightRadius:px(8),
				margin:px(1)
			},
			' .dlgContent':{
				minHeight:px(400),
				maxHeight: '80vh',
				margin: px(10),
				overflowY: css.auto,
				height:'calc(100% - 95px)',
				' .lastWarning':{
					padding:px(10),
					color:'#ff0',
					fontWeight:css.bold,
					backgroundColor:'#f00'
				}
			},
			' .dlgButtons':{
				padding:px(3),
				textAlign: css.right,
				borderTop: $T.border(1, Color.lightGray),
				' .customButtons':{
					display: css.inline
				},
				' button':{
					margin: px(5),
					textTransform: css.uppercase
				}
			},
			' .buttonsRow':{
				width:pc(100),
				display:css.flex,
				justifyContent: css.center,
				' button':{
					margin:px(20)
				}
			}
		}
	},
	'.nacreFloatingDialog':{
		position:css.absolute,
		// left:0, top:0,
		left:`calc((100vw - ${settings.floatingDialog.width}px)/2)`,
		top:px(100),
		//width:px(settings.floatingDialog.width),
		//height:'calc(90vh)',
		backgroundColor: Color.white,
		border: $T.border(1, Color.lightGray),
		borderRadius: px(8),
		' .dlgTitle':{
			width:'calc(100% - 6px)',
			height:px(20),
			padding:px(3),
			// backgroundColor:Color.header.back,
			// color:Color.header.text,
			textAlign:css.center,
			fontWeight:css.bold,
			fontSize:px(16),
			//border:$T.border(1, '#0f0'),
			borderBottom: $T.border(1, Color.lightGray),
			borderTopLeftRadius:px(8),
			borderTopRightRadius:px(8),
			cursor:css.pointer
		},
		' .dlgContent':{
			overflow:css.auto,
			maxHeight:'calc(80vh)',
			padding:px(5),
			margin:px(5)
		},
		' .dlgFooter':{
			borderTop: $T.border(1, Color.lightGray),
			padding:px(5),
			textAlign:css.right
		}
	}

}))));

const getZIndex = (function(){
	let level = 100;
	return function(){
		return level++;
	};
})();

const modalDialog = (function(){

	function hideDialog(dlg){
		dlg.find('.dlgContent').html('');
		dlg.hide();
		document.location.hash = '';
	}

	function open(dlgID, constructor, immediately, zIndex, noCancel=false){
		let {markup, div, span, button} = $H;
		let dlg = $('#'+dlgID);
		if(!dlg.length){
			dlg = $(div({id:dlgID, 'class':'nacreModalDialog'},
				div({'class':'dlgBody'},
					div({'class':'dlgIcon'}),
					div({'class':'dlgTitle'}),
					div({'class':'dlgContent'}),
					div({'class':'dlgButtons'},
						div({'class':'customButtons'}),
						button({'class':'btClose'}, 'Закрыть')
					)
				)
			));
			$('body').append(dlg);
			dlg
				.click(function(){
					if(dlg.hasClass('noCancel')) return;
					hideDialog(dlg);
				})
				.find('.dlgBody').click(function(ev){
					ev.stopPropagation();
				}).end()
				.find('.btClose').click(function(){
					hideDialog(dlg);
				}).end()
			;
		}
		constructor(dlg);

		dlg
			.css({zIndex:zIndex || getZIndex()})
			.find('.btClose').each(function(i, el){el=$(el);
				if(noCancel) el.hide();
				else el.show();
			}).end()
		;
		dlg[noCancel?'addClass':'removeClass']('noCancel');
		dlg[immediately?'show':'fadeIn']();
		return dlg;
	}

	return {open, getZIndex};
})();

const floatingDialog = (function(){
	let catched;
	let offset;

	function open(dlgClass, constructor){
		const {markup,apply,div,span,button} = $H;
		let dlg = $(div({'class':'nacreFloatingDialog ' + dlgClass},
			div({'class':'dlgTitle', draggable:true}),
			div({'class':'dlgContent'}),
			div({'class':'dlgFooter'},
				div({'class':'dlgButtons'},
					div({'class':'customButtons'}),
					button({'class':'btClose'}, 'Close')
				)
			)
		));
		dlg
			.css({zIndex:getZIndex()})
			.find('.btClose').click(function(){
				dlg.remove();
			}).end()
			.find('.dlgTitle')
				.bind({
					mousedown:function(ev){ 
						catched = dlg;
						const dlgOffset = dlg.offset();
						//console.log(dlgOffset);
						offset = {
							x:ev.originalEvent.clientX - dlgOffset.left, 
							y:ev.originalEvent.clientY - dlgOffset.top}
						;
						dlg.css({zIndex:getZIndex()});
					},
					mouseup:function(ev){ 
						catched = null;
					},
					mousemove:function(ev){ 
						if(catched) setPosition(ev, dlg);
					}
				})
			.end()
		;

		$('body').append(dlg);
		constructor(dlg);
	}

	function setPosition(ev, dlg){
		const pos = (ev=>({
			x:ev.clientX - 50, // - ev.offsetX,
			y:ev.clientY - 10  // - ev.offsetY 
		}))(ev.originalEvent);
		//console.log(pos, offset);
		
		dlg.css({top:px(pos.y), left:px(pos.x - offset.x)});
	}

	$('body').bind({
		mousemove:function(ev){
			if(catched) setPosition(ev, catched);
		}
	});


	return {open};
})();


export {modalDialog, floatingDialog};

