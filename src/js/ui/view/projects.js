'use strict';

// dom
const {
	ul, li, i, form, h, h2, a, label,
	section, header, button, span, img, p, div, input,
	table, thead, tbody, tfoot, tr, td, th
} = require('iblokz-snabbdom-helpers');
const userImg = require('../comp/user-img');
const modal = require('../comp/modal');
const projectComp = require('../comp/project');

// util
const dom = require('../../util/dom');
const collection = require('../../util/collection');

module.exports = ({state, actions, i18n}) => section('#view.projects', [
	section('.group', [
		h2('Personal'),
		ul([].concat(
			state.projects.list.map(project =>
				li('.modal', {
					class: {opened: state.projects.editing === project._id},
					on: {dblclick: ev => actions.projects.edit(project._id)}

				}, [
					div('.project-name', project.name),
					div('.project-data', [
						div('.project-tasks', [
							'Tasks: ', state.tasks.list.filter(task => task.project.name === project.name).length
						]),
						div('.project-users', [].concat(
							state.users.list.filter(user => user._id === project.createdBy),
							project.users || []
						).map(user => userImg({user})))
					]),
					(state.projects.editing === project._id) ? modal({
						onClose: () => actions.projects.edit(null)
					}, span('.project-edit', [
						span('.task-settings.dropdown.to-left', [
							i(`.handle.fa.fa-sliders`),
							ul([
								li(
									{
										on: {
											click: ev => actions.projects.update(project._id, {archived: !project.archived})
										}
									},
									span(project.archived
										? [i('.fa.fa-envelope-open-o'), ' Restore']
										: [i('.fa.fa-trash-o'), ' Archive']
									)
								)
							])
						]),
						h2('[contenteditable="true"]', {
							on: {blur: ev => actions.projects.update(project._id, {name: ev.target.textContent}, false)}
						}, project.name),
						label('Users'),
						ul('.project-users', [].concat(
							project.users ? project.users.map(user => li(userImg({
								user,
								click: () => actions.projects.toggleUser(project._id, user)
							}))) : '',
							li(button('.dropdown', [
								i('.fa.fa-plus.handle')
								// show available users
								/*
								ul(collection.unique(state.users.list, [{
									_id: project.createdBy
								}].concat(project.users))
									.map(user => li(userImg({
										user,
										click: () => actions.projects.toggleUser(project._id, user)
									})))
								)
								*/
							]))
						))
					])) : ''
				])
			),
			li('.add-project', form({
				on: {
					submit: ev => {
						ev.preventDefault();
						const data = dom.formToData(ev.target);
						actions.projects.add(data);
						dom.clearForm(ev.target);
					}
				}
			}, input(`[name="name"][placeholder="${i18n.common.addProject}"]`)))
		))
	])
]);
