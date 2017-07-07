'use strict';

const {
	ul, li, i, h2, a, pre,
	section, header, span, img, p, div,
	table, thead, tbody, tfoot, tr, td, th,
	form, frameset, legend, label, input, button
} = require('iblokz-snabbdom-helpers');
// components
const modal = require('./modal');
const userImg = require('./user-img');

// lib
const moment = require('moment');
const marked = require('marked');

// util
const collection = require('../../util/collection');

const taskTypeIcons = {
	dev: 'fa-code',
	bug: 'fa-bug',
	sync: 'fa-commenting-o',
	research: 'fa-book',
	planning: 'fa-road',
	activity: 'fa-child'
};

// time related
const getTimestamp = () => new Date().getTime() / 1000 | 0;

const getTrackedTime = task => task.activities
	.filter(act => act.type === 'tracking' && act.end > 0)
	.reduce((ass, act) => ass + act.end - act.start, 0) * 1000;

const getCurrentTracking = task => getTrackedTime(task) +
	(getTimestamp() - task.activities.slice(-1).pop().start) * 1000;

module.exports = ({task, state, actions, opened = false}, content = false) => li('.task.modal', {
	class: {opened},
	on: {dblclick: ev => actions.tasks.edit(task._id)},
	attrs: {'task-id': task._id, 'task-status': task.status},
	props: {draggable: !opened}
}, [].concat(
	content && content || [
		span('.task-name', [
			i(`.fa.${taskTypeIcons[task.type] || 'fa-code'}`), task.name
		]),
		span('.task-users', (task.users || []).map(user => userImg({user}))),
		span('.task-project', task.project.name || task.project), span('.task-status', task.status),
		span('.task-time', [].concat(
			(task.status === 'doing')
				? [i('.fa.fa-clock-o'), span('task-ass', moment.utc(getCurrentTracking(task)).format('H:mm:ss'))]
				: span('task-ass', moment.utc(getTrackedTime(task)).format('H:mm')),
			'/',
			span('.task-est', moment.utc(task.est * 10000).format('H:mm'))
		))
	],
	(opened) ? modal({
		onClose: () => actions.tasks.edit(null)
	}, span('.task-edit', [
		span('.dropdown.task-type', [
			i(`.handle.fa.${taskTypeIcons[task.type] || 'fa-code'}`),
			ul(Object.keys(taskTypeIcons).map(type =>
				li({
					on: {
						click: () => actions.tasks.update(task._id, {type}, false)
					}
				}, span([
					i(`.fa.${taskTypeIcons[type]}`), ' ', type
				]))
			))
		]),
		h2('[contenteditable="true"]', {
			on: {blur: ev => actions.tasks.update(task._id, {name: ev.target.textContent}, false)}
		}, task.name),
		pre('.task-story', [
			span('[contenteditable="true"][placeholder="Story ..."]', {
				on: {
					focus: ev => {
						ev.target.textContent = task.story || '';
						// (ev.target.innerHTML = task.story ? marked(task.story) : '')
					},
					blur: ev => {
						actions.tasks.update(task._id, {story: ev.target.textContent}, false);
					}
				}
			}, task.story ? task.story : 'Story ...'),
			div('.task-story-edit-type', [
				button('wysiwyg'),
				button('markdown')
			])
		]),
		label('Users'),
		ul('.task-users', [].concat(
			task.users ? task.users.map(user => li(userImg({
				user,
				click: () => actions.tasks.toggleUser(task._id, user)
			}))) : '',
			li(button('.dropdown', [
				i('.fa.fa-plus.handle'),
				// show available users
				ul(collection.unique(state.users.list, task.users || [])
					.map(user => li(userImg({
						user,
						click: () => actions.tasks.toggleUser(task._id, user)
					})))
				)
			]))
		)),
		label('Activities'),
		ul('.task-activities', task.activities.map(act =>
			li([
				span('.act-type', act.type),
				input('.act-start[type="datetime-local"]', {
					on: {
						change: ev => actions.tasks.actUpdate(task._id, act._id, {
							start: moment(ev.target.value, 'YYYY-MM-DDTHH:mm').unix()
						})
					},
					attrs: {
						value: moment.unix(act.start).format('YYYY-MM-DDTHH:mm')
					}
				}),
				act.end > 0 ? input('.act-end[type="datetime-local"]', {
					on: {
						change: ev => actions.tasks.actUpdate(task._id, act._id, {
							end: moment(ev.target.value, 'YYYY-MM-DDTHH:mm').unix()
						})
					},
					attrs: {
						value: act.end && moment.unix(act.end).format('YYYY-MM-DDTHH:mm')
					}
				}) : 'In progress ...'
			])
		))
	])) : ''
));
