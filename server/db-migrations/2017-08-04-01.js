'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const ObjectID = require('mongodb').ObjectID;

module.exports = ({db}) => {
	const User = db.model('User');
	const Task = db.model('Task');
	const Project = db.model('Project');
	// projects
	console.log('>> tasks');
	// project.users missing -> get users (assigned) from project
	console.log('- project.users missing -> get users (assigned) from project');
	Task.find({'project.users': {$exists: false}})
		.then(tasks => tasks.forEach(task => Project.findOne({_id: task.project._id})
			.then(project => {
				console.log(project);
				task.set('project', project.toObject());
				task.save();
			})
		));

	console.log('end');
};
