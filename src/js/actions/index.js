'use strict';

const {obj, arr} = require('iblokz-data');

const tasks = require('./tasks');
const users = require('./users');
const projects = require('./projects');

const supportedLanguages = ['bg', 'en', 'es', 'de', 'es', 'ko'];
const getBrowserLang = () => [(navigator.languages
  ? navigator.languages[0]
  : (navigator.language || navigator.userLanguage)
).slice(0, 2)]
	.map(lang => supportedLanguages.indexOf(lang) > -1 ? lang : 'en').pop();

// initial
const initial = {
	// view: table, columns, calendar
	view: 'list',
	project: false,
	lang: getBrowserLang(),
	modal: false
};

const reset = () => state => Object.assign({}, state, {
	projects: projects.initial,
	tasks: tasks.initial,
	project: false
});

// actions
const set = (key, value) => state => obj.patch(state, key, value);
const toggle = key => state => obj.patch(state, key, !obj.sub(state, key));
const arrToggle = (key, value) => state => obj.patch(state, key, arr.toggle(obj.sub(state, key), value));
const resetProject = () => state => Object.assign({}, state, {project: false});

module.exports = {
	initial,
	tasks,
	users,
	projects,
	set,
	toggle,
	arrToggle,
	resetProject,
	reset
};
