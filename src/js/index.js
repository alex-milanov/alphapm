'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;
const request = require('./util/request');

// moment
const moment = require('moment');
require("moment/min/locales.min");
moment.locale('bg');

// vex code
const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-top';

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');
// window.obj = obj;

const langs = ['bg', 'en', 'es', 'de'];

// util
const time = require('./util/time');

// app
const app = require('./util/app');
let actions = require('./actions');
window.actions = actions;
let ui = require('./ui');
let actions$;
let i18n = {
	bg: require('./i18n/bg.json'),
	en: require('./i18n/en.json'),
	es: require('./i18n/es.json'),
	ko: require('./i18n/ko.json'),
	de: require('./i18n/de.json')
};

// services
// auth
const auth = require('./services/auth');
actions.auth = auth.actions;

// adapt actions
actions = app.adapt(actions);

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(Object.assign({},
			require('./actions'),
			{
				auth: auth.actions
			}
		));
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
	// i18n
	module.hot.accept([
		"./i18n/bg.json",
		"./i18n/en.json",
		"./i18n/es.json",
		"./i18n/ko.json",
		"./i18n/de.json"
	], function() {
		i18n = {
			bg: require('./i18n/bg.json'),
			en: require('./i18n/en.json'),
			es: require('./i18n/es.json'),
			ko: require('./i18n/ko.json'),
			de: require('./i18n/de.json')
		};
		actions.stream.onNext(state => state);
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
const state$ = actions$
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.publish();

// services hooks
auth.hook({state$, actions});

// state -> ui
// const ui$ = time.loop(state$).map(({state}) => ui({state, actions}));
//	.map(uiPatch => (console.log({uiPatch}), uiPatch));
// const ui$ = state$.map(state => ui({state, actions}));
console.log(i18n);
const ui$ = $.combineLatest(
	state$,
	$.interval(500),
	(state, time) => ({state, time})
)
	.map(({state}) => ui({state, actions, i18n: i18n[state.lang]}));

vdom.patchStream(ui$, '#ui');

state$
	.distinctUntilChanged(state => state.tasks.needsRefresh)
	.filter(state => state.tasks.needsRefresh)
	.subscribe(state => actions.tasks.refresh());

state$
	.distinctUntilChanged(state => state.auth.user)
	.filter(state => state.auth.user)
	.subscribe(state => actions.set('modal', false));

state$
	.distinctUntilChanged(state => state.view)
	.subscribe(state => actions.set(['tasks', 'filters', 'search'], ''));

// syncing
// tasks
state$
	.distinctUntilChanged(state => state.tasks.list)
	.subscribe(state => {
		request
			.patch('/api/tasks')
			.send({list: state.tasks.list})
			.then(res => console.log(res.body));
	});
// projects
state$
	.distinctUntilChanged(state => state.projects.list)
	.subscribe(state => {
		request
			.patch('/api/projects')
			.send({list: state.projects.list})
			.then(res => console.log(res.body));
	});

state$
	.distinctUntilChanged(state => state.lang)
	.subscribe(state => moment.locale(state.lang));

// resources sync
// tasks
$.interval(5000 /* ms */).timeInterval().startWith({})
		.withLatestFrom(state$, (t, state) => state)
		.flatMap(state => request
			.get('/api/tasks?limit=1000')
			.set(state.auth.token && {'x-access-token': state.auth.token} || {})
			.observe()
		).filter(res => res.status === 200)
		.subscribe(res => actions.tasks.upsert(res.body.list));

// projects
$.interval(10000 /* ms */).timeInterval().startWith({})
		.withLatestFrom(state$, (t, state) => state)
		.flatMap(state => request
			.get('/api/projects?limit=1000')
			.set(state.auth.token && {'x-access-token': state.auth.token} || {})
			.observe()
		).filter(res => res.status === 200)
		.subscribe(res => actions.projects.upsert(res.body.list));

// users
$.interval(10000 /* ms */).timeInterval().startWith({})
		.withLatestFrom(state$, (t, state) => state)
		.flatMap(state => request
			.get('/api/users?limit=1000')
			.observe()
		).filter(res => res.status === 200)
		.subscribe(res => actions.users.upsert(res.body.list));

// connect state stream
state$.connect();
