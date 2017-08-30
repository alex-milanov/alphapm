'use strict';

const {obj} = require('iblokz-data');
const objectId = require('bson-objectid');
const {diff, applyChange, applyDiff} = require('deep-diff');
const collection = require('../../util/collection');

const initial = {
	needsRefresh: false,
	editing: null,
	filters: {
		donePeriod: 'thisWeek',
		agendaStatus: ['todo', 'doing'],
		search: ''
	},
	list: []
};

const getOrCreateProject = (name, list) => collection.elementAt(list, 'name', name || 'Personal') || {
	_id: objectId().str,
	name
};

const add = ({name, project, type, status}) => state => [
	getOrCreateProject(project || name.split(', ')[1] || state.project.name || 'Personal', state.projects.list)
].map(project =>
	obj.patch(obj.patch(state, 'tasks', {
		list: state.tasks.list.concat({
			_id: objectId().str,
			name: name.split(', ')[0],
			project,
			type: type || name.split(', ')[2] || 'dev',
			users: [],
			status: status || 'backlog',
			est: 0,
			createdAt: new Date(),
			createdBy: state.auth.user && state.auth.user._id || null,
			activities: []
		})
	}), 'projects', {
		list: collection.patchAt(state.projects.list, 'name', project.name, project)
	})
).pop();

const update = (id, patch, needsRefresh = false) => state => obj.patch(state, 'tasks', {
	needsRefresh,
	list: collection.patchAt(state.tasks.list, '_id', id, patch)
});

const trackTime = (id, status, timestamp = new Date().getTime() / 1000 | 0) =>
	state => obj.patch(state, 'tasks', {
		needsRefresh: true,
		list: collection.patchAt(state.tasks.list, '_id', id, task => Object.assign({}, task, {
			status,
			activities: (status === 'doing')
				? (task.activities.length === 0 || ((timestamp - task.activities.slice(-1).pop().end) > 60))
					? [].concat(
						task.activities || [],
						{
							_id: objectId().str,
							start: timestamp,
							type: 'tracking',
							end: 0
						}
					)
					: [].concat(
						task.activities.slice(0, -1) || [],
						Object.assign(
							{},
							task.activities.slice(-1).pop(),
							{
								end: 0
							}
						)
					)
				: [].concat(
					task.activities.slice(0, -1) || [],
					Object.assign(
						{},
						task.activities.slice(-1).pop(),
						{
							end: timestamp
						}
					)
				)
		})).map(task =>
			(task._id !== id && status === 'doing' && task.status === 'doing')
				? Object.assign({}, task, {
					status: 'todo',
					activities: [].concat(
						task.activities.slice(0, -1) || [],
						Object.assign(
							{},
							task.activities.slice(-1).pop(),
							{
								end: timestamp
							}
						)
					)
				})
				: task
		)
	});

const refresh = () => state => obj.patch(state, 'tasks', {needsRefresh: false});
const edit = (editing = null) => state => obj.patch(state, 'tasks', {editing});

const upsert = tasks => state =>
	diff(tasks, state.tasks.list)
	? obj.patch(state, 'tasks', {
		needsRefresh: true,
		list: [collection.extract(tasks, '_id')].map(ids =>
			[].concat(
				state.tasks.list.filter(task => ids.indexOf(task._id) === -1),
				tasks.map(task => (
	//				console.log(arrElAt(state.tasks.list, '_id', task._id), task),
					Object.assign({}, collection.elementAt(state.tasks.list, '_id', task._id) || {}, task)
				))
			)
		).pop()
	})
	: state;

const actUpdate = (taskId, id, patch) => state => obj.patch(state, 'tasks', {
	needsRefresh: false,
	list: collection.patchAt(state.tasks.list, '_id', taskId, {
		activities: collection.patchAt(
			collection.elementAt(state.tasks.list, '_id', taskId).activities,
			'_id', id, patch)
	})
});

const toggleUser = (taskId, user) => state => obj.patch(state, 'tasks', {
	needsRefresh: false,
	list: collection.patchAt(state.tasks.list, '_id', taskId, {
		users: [collection.elementAt(state.tasks.list, '_id', taskId).users].map(taskUsers => [].concat(
			taskUsers.filter(u => u._id !== user._id),
			collection.indexAt(taskUsers, '_id', user._id) > -1 ? [] : user
		)).pop()
	})
});

const move = (taskId, projectId) => state => obj.patch(state, 'tasks', {
	needsRefresh: true,
	list: collection.patchAt(state.tasks.list, '_id', taskId, {
		project: state.projects.list
			.filter(p => p._id === projectId)
			.map(({_id, name, users}) => ({_id, name, users}))
			.pop()
	})
});

module.exports = {
	initial,
	add,
	update,
	edit,
	trackTime,
	refresh,
	upsert,
	actUpdate,
	toggleUser,
	move
};
