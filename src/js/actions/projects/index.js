'use strict';

const {obj} = require('iblokz-data');
const objectId = require('bson-objectid');
const {diff, applyChange, applyDiff} = require('deep-diff');
const collection = require('../../util/collection');

const initial = {
	list: [],
	editing: null
};

const add = project => state => obj.patch(state, 'projects', {
	list: [].concat(
		state.projects.list,
		Object.assign({},
			project,
			{
				_id: objectId().str,
				users: [],
				createdAt: new Date(),
				createdBy: state.auth.user && state.auth.user._id || null
			}
		)
	)
});

const edit = (editing = null) => state => obj.patch(state, 'projects', {editing});

const update = (id, patch) => state => obj.patch(state, 'projects', {
	list: collection.patchAt(state.projects.list, '_id', id, patch)
});

const upsert = list => state =>
	diff(list, state.projects.list)
	? obj.patch(state, 'projects', {
		list: [collection.extract(list, '_id')].map(ids =>
			[].concat(
				state.projects.list.filter(project => ids.indexOf(project._id) === -1),
				list.map(project => (
	//				console.log(arrElAt(state.projects.list, '_id', project._id), project),
					Object.assign({}, collection.elementAt(state.projects.list, '_id', project._id) || {}, project)
				))
			)
		).pop()
	})
	: state;

const toggleUser = (projectId, user) => state => obj.patch(obj.patch(state, 'projects', {
	needsRefresh: false,
	list: collection.patchAt(state.projects.list, '_id', projectId, {
		users: [collection.elementAt(state.projects.list, '_id', projectId).users].map(projectUsers => [].concat(
			projectUsers.filter(u => u._id !== user._id),
			collection.indexAt(projectUsers, '_id', user._id) > -1 ? [] : user
		)).pop()
	})
}), 'tasks', {
	needsRefresh: false,
	list: [].concat(
		state.tasks.list.filter(task => task.project._id !== projectId),
		state.tasks.list.filter(task => task.project._id === projectId)
			.map(task => obj.patch(task, 'project', {
				users: [collection.elementAt(state.projects.list, '_id', projectId).users].map(projectUsers => [].concat(
					projectUsers.filter(u => u._id !== user._id),
					collection.indexAt(projectUsers, '_id', user._id) > -1 ? [] : user
				)).pop()
			}))
	)
});

module.exports = {
	initial,
	add,
	edit,
	update,
	upsert,
	toggleUser
};
