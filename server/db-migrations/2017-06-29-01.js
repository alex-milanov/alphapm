'use strict';

const Rx = require('rx');
const $ = Rx.Observable;

module.exports = ({db}) => {
	const Task = db.model('Task');
	const Project = db.model('Project');
	// tasks
	// createdOn -> createdAt
	console.log('createdOn -> createdAt');
	Task.find({createdOn: {$exists: true}}).then(tasks => tasks.forEach(task => {
		task.set('createdAt', task.createdOn);
		task.set('createdOn', undefined);
		task.save();
	}));
	console.log('task.project: "String" => task.project: {name: "String", _id: ObjectID}');
	// task.project: "String" => task.project: {name: "String", _id: ObjectID}
	Task.find({project: {$type: 'string'}}).then(tasks => tasks.forEach(task => {
		// console.log(task.project);
		Project.findOneAndUpdate({name: task.project}, {name: task.project}, {upsert: true, new: true},
			(err, res) => {
				// console.log(res, err);
				task.set('project', res.toObject());
				task.save(err => console.log(err));
			});
	}));
	console.log('end');
};
