const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
JWTStrategy = passportJWT.Strategy,
ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, (username, password, callback) => {
  console.log(username + '  ' + password);
  Users.findOne({ Username: username }).then((user) => {
    if (!user) {
      console.log('Incorrect username');
      return callback(null, false, {message: 'Incorrect username or password.'});
    } else {
      console.log('finished');
      return callback(null, user);
    }}).catch((error) => {
    console.log('Error' + error)
    return callback(error)
  });
}));

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, (jwtPayload, callback) => {
  return Users.findById(jwtPayload._id).then((user) => {
      return callback(null, user);
    }).catch((error) => {
      return callback(error)
    });
}));