'use strict';

// dom
const {
	ul, li, i, form, h, a,
	section, header, button, span, img, p, div, input,
	table, thead, tbody, tfoot, tr, td, th
} = require('iblokz-snabbdom-helpers');
// components
const taskLi = require('../comp/task-li');

// lib
const moment = require('moment');
const Sortable = require('sortablejs');
const {obj} = require('iblokz-data');
// util
const dom = require('../../util/dom');
const file = require('../../util/file');

const getTimestamp = () => new Date().getTime() / 1000 | 0;

const latestTime = task => getTimestamp() - task.activities.filter(a => a.type === 'tracking').sort().pop().start;

const statuses = ['backlog', 'todo', 'doing', 'done'];

const prepTasks = state => state.tasks.list
	.filter(task =>
		state.project === false || (task.project.name || task.project) === (state.project.name || state.project))
	// filter by status
	.filter(task => state.tasks.filters.agendaStatus.indexOf(task.status) > -1)
	// filter by period for done tasks
	.filter(task =>
		task.status !== 'done'
		|| state.tasks.filters.agendaStatus.indexOf('done') === -1
		|| state.tasks.filters.donePeriod === 'all'
		|| state.tasks.filters.donePeriod === 'thisWeek'
			&& task.activities.length > 0 && task.activities.slice(-1).pop().end >= moment().startOf('isoweek').unix()
		|| state.tasks.filters.donePeriod === 'thisMonth'
			&& task.activities.length > 0 && task.activities.slice(-1).pop().end >= moment().startOf('month').unix()
	)
	.filter(task =>
		state.tasks.filters.search === ''
		|| task.name.match(new RegExp(state.tasks.filters.search, 'ig'))
		|| task.story && task.story.match(new RegExp(state.tasks.filters.search, 'ig'))
		|| task.project && task.project.name && task.project.name.match(new RegExp(state.tasks.filters.search, 'ig'))
		|| task.user && task.user.name && task.user.name.match(new RegExp(state.tasks.filters.search, 'ig'))
	)
	// order in reverse by status
	.sort((a, b) => statuses.indexOf(a.status) > statuses.indexOf(b.status) ? -1 : 1);

const toCSV = (fields, list) => [].concat(
	fields.map(field => `"${field}"`).join(','),
	list.map(row => fields
		.map(field => obj.switch(field, {
			default: () => row[field],
			project: () => row.project.name,
			time: () => moment.utc(
				row.activities
					.filter(act => act.type === 'tracking' && act.end > 0)
					.reduce((ass, act) => ass + act.end - act.start, 0) * 1000
			).format('H:mm')
		})())
		.map(val => typeof val === "string" && val.match(/,/)
			? `"${val}"` : val
		)
		.join(','))
).join("\n");

module.exports = ({state, actions, i18n}) => section('#view.list', [
	div('.filter-row', [].concat(
		`${i18n.view.list.showingTasks}: `,
		a('.filter-box.dropdown', [
			span('.handle',
				state.tasks.filters.agendaStatus.map(status => i18n.task.status[status]).join(', ')
			),
			ul(statuses.map(status =>
				li('.text-left', {
					on: {
						click: () => actions.arrToggle(['tasks', 'filters', 'agendaStatus'], status)
					}
				}, span([
					i('.fa', {
						class: {
							'fa-check-circle-o': state.tasks.filters.agendaStatus.indexOf(status) > -1,
							'fa-circle-o': state.tasks.filters.agendaStatus.indexOf(status) === -1
						}
					}),
					' ',
					i18n.task.status[status] || ''
				]))
			))
		]),
		state.tasks.filters.agendaStatus.indexOf('done') > -1 ? [', ', a('.filter-box.dropdown', [
			span('.handle',
				`(${i18n.task.filters.donePeriod[state.tasks.filters.donePeriod]})` || ''),
			ul(['all', 'thisWeek', 'thisMonth'].map(period =>
				li('.text-left', {
					on: {
						click: () => actions.set(['tasks', 'filters', 'donePeriod'], period)
					}
				}, span([
					i('.fa', {
						class: {
							'fa-dot-circle-o': state.tasks.filters.donePeriod === period,
							'fa-circle-o': state.tasks.filters.donePeriod !== period
						}
					}),
					' ',
					i18n.task.filters.donePeriod[period] || ''
				]))
			))
		])] : '',
		button('.fa.fa-download.right[title="export to .csv"]', {
			on: {click: ev => file.save('tasks.csv', toCSV(['name', 'type', 'project', 'time'], prepTasks(state)))}
		})
	)),
	(state.tasks.needsRefresh === false) ? ul('.tasks', {
		hook: {
			insert: vnode =>
				new Sortable(vnode.elm, {
					group: 'table',
					draggable: 'li.task',
					filter: '.opened',
					preventOnFilter: false,
					ghostClass: "placeholder"
				})
		}
	}, [
		li('.add-task', form({
			on: {
				submit: ev => {
					ev.preventDefault();
					const data = dom.formToData(ev.target);
					actions.tasks.add(Object.assign(data, {status: 'todo'}));
					actions.set(['tasks', 'filters', 'search'], '');
					dom.clearForm(ev.target);
				}
			}
		}, input(`[name="name"][placeholder="${i18n.common.addTask}"]`, {
			on: {
				input: ev => actions.set(['tasks', 'filters', 'search'], ev.target.value)
			}
		})))
	].concat(
		prepTasks(state).map(task =>
			taskLi({task, state, actions, opened: state.tasks.editing === task._id}, [
				span('.task-name', [
					i('.fa', {
						class: {
							'fa-code': task.type === 'dev',
							'fa-bug': task.type === 'bug',
							'fa-commenting-o': task.type === 'sync',
							'fa-book': task.type === 'research',
							'fa-road': task.type === 'planning'
						}
					}),
					task.name
				]),
				span('.task-project', task.project.name || task.project),
				span('.task-status', i18n.task.status[task.status]),
				span('.task-time',
					(task.status === 'doing')
						? [
							i('.fa.fa-clock-o'),
							span('.task-ass', moment.utc(
								task.activities
									.filter(act => act.type === 'tracking' && act.end > 0)
									.reduce((ass, act) => ass + act.end - act.start, 0) * 1000 +
								(getTimestamp() - task.activities.slice(-1).pop().start) * 1000)
								.format('H:mm:ss')
							),
							// '/',
							// span('.task-est', moment.utc(task.est * 10000).format('H:mm')),
							button('.fa.fa-pause-circle[style="color: #d6c533"]', {
								on: {
									click: () => actions.tasks.trackTime(task._id, 'todo')
								}
							}),
							button('.fa.fa-check-circle[style="color: #4faf3a"]', {
								on: {
									click: () => actions.tasks.trackTime(task._id, 'done')
								}
							})
						]
						: [
							span('task-ass', moment.utc(
								task.activities
									.filter(act => act.type === 'tracking' && act.end > 0)
									.reduce((ass, act) => ass + act.end - act.start, 0) * 1000
							).format('H:mm')),
							'/',
							span('.task-est', moment.utc(task.est * 10000).format('H:mm')),
							button('.fa.fa-play-circle', {
								on: {
									click: () => actions.tasks.trackTime(task._id, 'doing')
								}
							})
						]
				)
			])
	))) : []
]);
