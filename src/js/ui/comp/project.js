'use strict';

const {
	ul, li, i, h2, a, pre,
	section, header, span, img, p, div,
	table, thead, tbody, tfoot, tr, td, th,
	form, frameset, legend, label, input, button
} = require('iblokz-snabbdom-helpers');
// components
const modal = require('./modal');

module.exports = ({project, state, actions, opened = false}, content = false) => span('.project.modal', {
}, [
	content || ''
]);
