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

app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let allowedOrigins = ['https://my-flix-8675-e6ac611a51d9.herokuapp.com', 'https://pleplu.github.io', 'http://localhost:4200', 'http://localhost:8080', 'http://localhost:1234', 'https://myflix8675.netlify.app'];
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

app.post('/users', [

  /**
   * Checks submitted user data for erros
   */
  check('Username', 'Username is too short').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()

], (req, res) => {

  // checks the validation object for errors
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } 
    
  // hashes user passwords on creation
  let hashedPassword = Users.hashPassword(req.body.Password);

 /**
  * Creates a new user if one does not already exist
  * @param user.Username
  * @param user.Password
  * @param user.Email
  * @param user.Birthday
  */
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

/**
 * Returns an array of movies
 * @param token
 * @returns /movies
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find().then((movies) => {
        res.status(201).json(movies);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });

/**
 * Returns a movie by title
 * @param token
 * @param Movie.Title
 * @retuns /movie/Title
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({Title: req.params.Title}).then((movie) => {
        res.status(201).json(movie);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });


/**
 * Returns genere by name
 * @param token
 * @param Genre.Name
 * @retuns /movie/genres/Genre
 */
app.get('/movies/genres/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({'Genre.Name': req.params.Genre}).then((movie) => {
        res.status(201).json(movie.Genre.Description);
    }).catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    });
});

/**
 * Returns a director by name
 * @param token
 * @param Director.Name
 * @retuns /movie/directors/Director
 */
app.get('/movies/directors/:Director', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({'Director.Name': req.params.Director}).then((movie) => {
        res.status(201).json(movie.Director);
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    });
});


/**
 * Returns an array of registered users
 * @param user.Username
 * @param token
 * @returns /users
 */
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find().then((users) => {
        res.status(201).json(users);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });

/**
 * Returns a user by username
 * @param user.Username
 * @param token
 * @returns /users/Username
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username }).then((user) => {
      res.json(user);
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
  * Edits a registered user's details
  * @param token
  * @param user.Username
  * @param user.Password
  * @param user.Email
  * @param user.Birthday
  */
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

/**
 * Adds a movie to a user's list of favorite movies
 * @param user.Username
 * @param MovieID
 * @param token
 */
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

/**
 * Deletes a movie from a user's list of favorite movies
 * @param user.Username
 * @param MovieID
 * @param token
 */
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

/**
 * Deletes a user by username from the database
 * @param user.Username
 * @param token
 */
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