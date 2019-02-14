import {KB} from '../../js/kb.js';

window.KB = KB;

const errors = [];

const $C = Clarino.version('1.2.0');
const $H = $C.simple;
const {px,pc} = $C.css.unit;
const css = $C.css.keywords;

$(function(){
	$('head').append($($C.html.style($C.css.stylesheet({
		'body':{
			fontFamily:'Verdana, Arial, Sans-Serif',
			fontSize:px(14),
			backgroundColor:'#ffa',
			'.error':{
				backgroundColor:'#f00'
			},
			'.success':{
				backgroundColor:'#0f0'
			},
			' h1':{
				fontSize:px(16)
			}
		}
	}))));
});

function assert(condition, errMsg){
	if(!condition) errors.push(errMsg || 'Error');
}


function displayResult(kb){
	$('body').addClass(errors.length?'error':'success');
	$('body').html($H.markup(
		$H.h1(kb.name),
		$H.div('KB v.'+kb.version),
		$H.div($H.a({href:document.location.href.match(/[^\.\/]+\.html/), target:'_blank'}, 'source code')),
		$H.apply(errors, e=>$H.div(e))
	));

	if(kb.errors.length){
		console.error('Nacre KB errors: %o', kb.errors);
	}
}

function Test(kb, testing){
	testing(kb);
	$(function(){
		displayResult(kb);
	});
}

function equalArrays(a1, a2){
	function includes(a1, a2){
		return a1.every(x=>a2.includes(x));
	}
	return includes(a1, a2) && includes(a2, a1);
}

function arrayDiff(a1, a2){
	function missing(a1, a2){
		return a2.filter(x=>!a1.includes(x));
	}
	return {missing:missing(a1, a2), excess: missing(a2, a1)};
}

//console.log(arrayDiff([1,2], [2,3]));

Object.assign(Test, {
	assert, equalArrays, arrayDiff
});


window.Test = Test;
