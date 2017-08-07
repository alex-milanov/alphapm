'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;
const request = require('../util/request');
const store = require('../util/store');
const {obj} = require('iblokz-data');

// const page = require('../page');

const forceLogout = () => state => {
	store.set('user', null);
	store.set('token', null);
	// window.location = '#/';
	return obj.patch(state, 'auth', {user: null, token: null});
};

const login = data => request
	.post('/api/auth')
  .send(data)
	.set('Accept', 'application/json')
	.observe()
	.map(res => res.body)
	.map(body => {
		if (body.success) {
			store.set('user', body.user);
			store.set('token', body.token);
			// window.location = '#/admin';
			return state => obj.patch(state, 'auth', {user: body.user, token: body.token});
		}
		return state => state;
	});

const logout = token => request
	.delete('/api/auth')
	.query({token})
	.set('Accept', 'application/json')
	.observe()
	.map(res => res.body)
	.map(data =>
		(data.success)
			? forceLogout()
			: state => state
	);

const actions = {
	forceLogout,
	login,
	logout: forceLogout,
	initial: {user: store.get('user'), token: store.get('token')}
};

const hook = state$ => {
};

module.exports = {
	actions,
	hook
};
