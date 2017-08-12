
const jwt = require('jsonwebtoken');

module.exports = ({app, db, config}) => {
	app.use(function(req, res, next) {
		// check header or url parameters or post parameters for token
		let token = req.body.token || req.params.token || req.headers['x-access-token'] || false;

		// console.log(req.body, {token});

		req.isAuthenticated = req.isAuthenticated || (() => (req.user !== undefined));

		// decode token
		if (token) {
			// verifies secret and checks exp
			jwt.verify(token, config.jwt.secret, function(err, r) {
				console.log({err, user: r});
				if (err) {
					// return res.json({success: false, message: 'Failed to authenticate token.'});
					return next();
				}
				// if everything is good, save to request for use in other routes
				req.user = {
					_id: r._doc._id,
					name: r._doc.name,
					email: r._doc.email,
					role: r._doc.role
				};
				return next();
			});
		} else {
			return next();
		}
	});

	app.route('/api/auth')
		.post(function(req, res) {
			// find the user
			db.model('User').findOne({email: req.body.email})
				.then(user => {
					if (!user) {
						res.json({success: false, message: 'Authentication failed. User not found.'});
					} else if (user) {
						console.log(user);
						// check if password matches
						if (!user.authenticate(req.body.password)) {
							res.json({success: false, message: 'Authentication failed. Wrong password.'});
						} else {
							// if user is found and password is right
							// create a token
							var token = jwt.sign(user, config.jwt.secret, config.jwt.options);

							delete (user.password);

							res.json({
								success: true,
								message: 'Enjoy your token!',
								token,
								user: {
									_id: user._id,
									name: user.name,
									email: user.email,
									role: user.role
								}
							});
						}
					}
				});
		});
		// delete -> adds to db storage
};
