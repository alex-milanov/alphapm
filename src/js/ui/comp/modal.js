'use strict';

const {
	ul, li, i, h2, a, pre,
	section, header, span, img, p, div,
	table, thead, tbody, tfoot, tr, td, th,
	form, frameset, legend, label, input, button
} = require('iblokz-snabbdom-helpers');

const getParent = (el, tagName) => (el.parentNode.tagName === tagName)
	? el.parentNode
	: getParent(el.parentNode, tagName);

const syncRect = (el, pos) => {
	const posRect = el.getBoundingClientRect();
	console.log(posRect);
	const wrapperEl = el.querySelector('.wrapper');

	Object.keys(pos).forEach(key => {
		if (['top', 'left', 'right', 'width', 'height'].indexOf(key) > -1)
			wrapperEl.style[key] = posRect[key] + 'px';
		if (['marginTop', 'marginLeft', 'marginBottom', 'marginRight'].indexOf(key) > -1)
			wrapperEl.style[key] = '0px';
		if (key === 'bottom')
			wrapperEl.style.bottom = (window.innerHeight - posRect.top - posRect.height) + 'px';
	});
};

module.exports = ({
	onClose = () => {},
	parent = 'LI',
	pos = {
		top: '20px',
		bottom: '20px',
		left: '50%',
		width: '628px',
		marginLeft: '-314px'
	}
}, content) => div('#wrapper.wrapper', {
	hook: {
		insert: ({elm}) => {
			syncRect(getParent(elm, 'LI'), pos);
			setTimeout(() => {
				Object.keys(pos).forEach(key => {
					elm.style[key] = pos[key];
				});
			});
		},
		remove: ({elm}) => {
			syncRect(getParent(elm, parent), pos);
			setTimeout(() => getParent(elm, parent).removeChild(elm), 1000);
		}
	}
}, [
	div('.modal-content', {
		style: {
			delayed: {
				opacity: 1
			}
		}
	}, [].concat(
		a('.close-modal', {
			on: {
				click: onClose
			}
		}, i('.fa.fa-close')),
		content
	))
]);
