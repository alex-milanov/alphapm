'use strict';

// dom
const {
	ul, li, i, a, form,
	section, header, button, span, img, p, div, input,
	table, thead, tbody, tfoot, tr, td, th, h1
} = require('iblokz-snabbdom-helpers');
// components
const modal = require('./comp/modal');
const userImg = require('./comp/user-img');

// lib
const moment = require('moment');

// util
const {obj} = require('iblokz-data');

const langFlags = {
	bg: 'bg',
	en: 'gb',
	de: 'de',
	es: 'es',
	ko: 'kr'
};

const formToData = form => Array.from(form.elements)
	// .map(el => (console.log(el.name), el))
	.filter(el => el.name !== undefined)
	.reduce((o, el) => ((o[el.name] = el.value), o), {});

module.exports = ({state, actions, views, i18n}) => header([
	ul('.toolbar.left', [
		li(ul('.accordion',
			views.map(view =>
				li({
					class: {active: view.key === state.view},
					on: {click: () => actions.set('view', view.key)}
				}, [
					i(`.fa.fa-${view.icon}`),
					span({
						style: {
							width: (view.key === state.view)
								? ((i18n.views[view.key].length * ((state.lang !== 'ko') ? 9 : 16)) + 7) + 'px' : '0px'
						}
					}, (view.key === state.view) ? i18n.views[view.key] : '')
				])
			)
		)),
		(['list', 'columns', 'calendar'].indexOf(state.view) > -1)
			? li(button('.dropdown', [
				span(state.project !== false && state.project.name || state.project || i18n.common.allProjects),
				i('.handle.fa.fa-toggle-down'),
				ul([].concat(
					state.project !== false
						? li({
							on: {
								click: () => actions.resetProject()
							}
						}, span(i18n.common.allProjects)) : [],
					(obj.sub(state, ['projects', 'list'])
						|| state.tasks.list.reduce((projects, task) => (projects.indexOf(task.project) === -1)
							? [].concat(projects, task.project)
							: projects, [])
					)
					.filter(project => state.project === false
							|| (project._id && project._id !== state.project._id)
							|| (!project._id && project !== state.project))
					.map(project =>
						li({on: {click: () => actions.set('project', project)}}, span(project.name || project))
					)))
			]))
			: ''
	]),
	img('.logo[src="assets/img/logo-2.svg"]'),
	ul('.toolbar.right', [
		li(span(moment().format('DD.MM.YY H:mm'))),
		li(a('.fa.fa-bell-o')),
		li(a('.dropdown.flags', [
			img(`.handle[src="assets/img/flags/${langFlags[state.lang || 'bg']}.svg"]`),
			ul(Object.keys(langFlags)
				.filter(lang => lang !== state.lang)
				.map(lang =>
					li({on: {click: () => actions.set('lang', lang)}}, img(`[src="assets/img/flags/${langFlags[lang]}.svg"]`))
				))
		])),
		li(
			a('.btn.modal', {
				style: {position: 'relative'},
				class: {
					opened: state.modal === 'sign-in',
					dropdown: state.auth.user
				},
				on: {
					click: () => (!state.auth.user && state.modal !== 'sign-in')
						? actions.set('modal', 'sign-in') : {}
				}
			},
				(!state.auth.user)
					? [
						i('.fa.fa-sign-in'),
						state.modal === 'sign-in' ? modal({
							onClose: () => setTimeout(() => actions.set('modal', false)),
							parent: 'A',
							pos: {
								top: '50%',
								left: '50%',
								width: '400px',
								height: '200px',
								marginTop: '-100px',
								marginLeft: '-200px'
							}
						}, [
							form('.block', {
								on: {
									submit: ev => {
										ev.preventDefault();
										setTimeout(actions.set('modal', false));
										setTimeout(() => {
											let data = formToData(ev.target);
											actions.auth.login(data);
										}, 700);
									}
								}
							}, [
								h1([
									i('.fa.fa-sign-in'),
									span([' ', i18n.auth.signIn])
								]),
								input('[type="text"][name="email"][placeholder="Email"]'),
								input('[type="password"][name="password"][placeholder="Password"]'),
								button(i18n.auth.signIn)
							])
						]) : ''
					]
				: [
					userImg({user: state.auth.user, selector: '.handle'}),
					ul([
						li(span(i18n.auth.editProfile)),
						li(span(i18n.auth.changePicture)),
						li({
							on: {
								click: () => setTimeout(() => actions.auth.logout())
							}
						}, [
							span([i('.fa.fa-sign-out'), ' ', i18n.auth.signOut])
						])
					])
				]
			)
		)
	])
]);
