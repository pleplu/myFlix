const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const cors = require('cors');
const app = express();
const { check, validationResult } = require('express-validator');

const mongoose = require('mongoose');
const Models = require('./models');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
});

// mongoose.connect('mongodb://0.0.0.0:27017/cfDB', { 
//     useNewUrlParser: true, 
//     useUnifiedTopology: true 
// });

app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let allowedOrigins = ['https://my-flix-8675-e6ac611a51d9.herokuapp.com', 'https://pleplu.github.io/myFlix-Angular', 'http://localhost:4200', 'http://localhost:8080', 'http://localhost:1234', 'https://myflix8675.netlify.app'];
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1) {
      let message = "The CORS policy for this application doesn't allow access from origin " + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

let logger = (req, res, next) => {
    console.log(req.url);
    next();
};
  
app.use(logger);

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

// CREATE A NEW USER
app.post('/users', [

  check('Username', 'Username is too short').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()

], (req, res) => {

  // check the validation object for errors
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } 
    
  let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }).then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }).then((user) => {
          res.status(201).json(user) 
        }).catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        })
      }
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// RETURN A LIST OF MOVIES
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find().then((movies) => {
        res.status(201).json(movies);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });

// RETURN A MOVIE BY TITLE
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({Title: req.params.Title}).then((movie) => {
        res.status(201).json(movie);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });


 // RETURN A DESCRIPTION OF A GENRE BY NAME
app.get('/movies/genres/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({'Genre.Name': req.params.Genre}).then((movie) => {
        res.status(201).json(movie.Genre.Description);
    }).catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    });
});

// RETURN A DIRECTOR BY NAME
app.get('/movies/directors/:Director', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({'Director.Name': req.params.Director}).then((movie) => {
        res.status(201).json(movie.Director);
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    });
});


// RETURN A LIST OF USERS
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find().then((users) => {
        res.status(201).json(users);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });

// RETURN A USER BY USERNAME
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username }).then((user) => {
      res.json(user);
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// UPDATE A USERS INFORMATION
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username }, { 
        $set: {
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
        }
    },
    { new: true }).then((user) => {
        res.json(user);;
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
    });

// UPDATE A MOVIE TO A USERS LIST OF FAVORITES
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, { 
        $push: { FavoriteMovies: req.params.MovieID }
     },
     { new: true }).then((user) => {
        res.json(user);;
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
    });

// DELETE A MOVIE FROM A USERS LIST OF FAVORITES
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, { 
        $pull: { FavoriteMovies: req.params.MovieID }
     },
     { new: true }).then((user) => {
        res.json(user);;
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
    });

// DELETE A USER BY USERNAME
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username }).then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});