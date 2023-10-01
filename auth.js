const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
passport = require('passport');

require('./passport'); 

/**
 * Generates a new token for users
 * @param user
 * @returns token
 */
let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
      subject: user.Username, 
      expiresIn: '7d', 
      algorithm: 'HS256' 
    });
}

/**
 * Invokes generateJWTToken when a user logs in, generating a token
 * @param user
 * @returns token
 */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json('Error' + error);
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}