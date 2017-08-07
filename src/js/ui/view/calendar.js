'use strict';

// data
const {str, obj} = require('iblokz-data');

// dom
const {
	ul, li, i, h2, label,
	section, header, button, span, img, p, div, input,
	table, thead, tbody, tfoot, tr, td, th
} = require('iblokz-snabbdom-helpers');
// components
const moment = require('moment');

const getWeekdays = () => {
	let iterator = moment().startOf('week');
	let weekdays = [];

	for (let i = 0; i < 7; i++) {
		weekdays.push(iterator.clone());
		iterator.add(1, 'day');
	}
	return weekdays;
};

const capitalize = chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1);

module.exports = ({state, actions, i18n}) => section('#view.calendar', getWeekdays().map((day, index) =>
	ul('.tasks', [].concat(
		li(label(capitalize(moment(day).format('dddd, D MMM')))),
		state.tasks.list.reduce((act, {activities, name, project, type, status}) =>
			[].concat(act, activities.map(act => Object.assign({}, act, {
				task: {name, project, type, status}
			}))), [])
			.filter(act =>
				act.start >= parseInt(moment(day).format('X'), 10)
				&& act.start <= parseInt(moment(day).endOf('day').format('X'), 10)
			).map(act =>
			li('.task', [
				div(act.task.name),
				div('.text-right', moment.unix(act.start).format('H:mm'))
			])
		),
		li('.add-task', [
			button(`${i18n.common.add} ...`)
		])
	)
)));
