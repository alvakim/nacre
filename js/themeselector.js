import {$,$C,$H} from './core.js';

const storageKey = 'NacreTheme';
const head = $('head');

export function ThemeSelector(themes){
	function setTheme(id){
		localStorage.setItem(storageKey, id);
		const elID = 'simpleViewTheme';
		let theme = $('#'+elID);
		if(!theme.length){
			theme = $($C.html.style({id:elID}));
			head.append(theme);
		}
		theme.html('/*simple view '+id+'*/\n'+$C.css.stylesheet(themes[id]));
	}

	function template (){
		const {div,select,option} = $H;
		const curTheme = localStorage.getItem(storageKey) || 'light';

		function opt(id, name){
			return option({value:id},
				curTheme==id?{selected:true}:null,
				name
			);
		}

		setTheme(curTheme);

		return div({id:'pnlTheme'}, 'Тема: ', select({id:'selTheme'},
			opt('light', 'светлая'),
			opt('dark', 'тёмная')
		));
	}
	
	function init(){
		$('#selTheme').change(function(){
			const v = $(this).val();
			setTheme(v);
		});
	}
	
	return {init, template};
}


