const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const app = express();

const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://0.0.0.0:27017/cfDB', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
});

app.use(morgan('common'));
app.use(bodyParser.json());

// let users = [

//     {
//         id: 1,
//         name: 'Steve',
//         favoriteMovie: []
//     },

//     {
//         id: 2,
//         name: 'Tyler',
//         favoriteMovie: []
//     },

//     {
//         id: 3,
//         name: 'Sarah',
//         favoriteMovie: []
//     }
// ];

// let movies = [
    
//     {
//         title: 'The Godfather',
//         genres: {
//             name: 'Crime',
//             description: 'Crime films, in the broadest sense, are a cinematic genre inspired by and analogous to the crime fiction literary genre.'
//         },
//         description: 'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.',
//         directors: {
//             name: 'Francis Ford Coppola',
//             born: 'April 7th, 1939',
//             bio: 'Francis Ford Coppola is an American film director, producer, and screenwriter.'
            
//         }
//     },

//     {
//         title: 'The Shawshank Redemption',
//         genres: {
//             name: 'Drama',
//             description: 'In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone.'
//         },
//         description: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
//         directors: {
//             name: 'Frank Darabont',
//             born: 'January 28, 1959',
//             bio: 'Frank Árpád Darabont is a French-born American film director, screenwriter and producer.'
//         }
//     },

//     {
//         title: 'Schindler\'s List',
//         genres: {
//             name: 'History',
//             description: 'A historical film is a fiction film showing past events or set within a historical period.'
//         },
//         description: 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.',
//         directors: {
//             name: 'Steven Spielberg',
//             born: 'December 18, 1946',
//             bio: 'Steven Allan Spielberg KBE is an American filmmaker.'
//         }
//     },
// ];

let logger = (req, res, next) => {
    console.log(req.url);
    next();
};
  
app.use(logger);

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

// CREATE A NEW USER
app.post('/users', (req, res) => {
    Users.findOne({ Username: req.body.Username }).then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + 'already exists');
        } else {
          Users.create({
              Username: req.body.Username,
              Password: req.body.Password,
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
app.get('/movies', (req, res) => {
    Movies.find().then((movies) => {
        res.status(201).json(movies);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });

// RETURN A MOVIE BY TITLE
app.get('/movies/:Title', (req, res) => {
    Movies.findOne({Title: req.params.Title}).then((movie) => {
        res.status(201).json(movie);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });


 // RETURN A DESCRIPTION OF A GENRE BY NAME
app.get('/movies/genres/:Genre', (req, res) => {
    Movies.findOne({'Genre.Name': req.params.Genre}).then((movie) => {
        res.status(201).json(movie.Genre.Description);
    }).catch ((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    });
});

// RETURN A DIRECTOR BY NAME
app.get('/movies/directors/:Director', (req, res) => {
    Movies.findOne({'Director.Name': req.params.Director}).then((movie) => {
        res.status(201).json(movie.Director);
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    });
});


// RETURN A LIST OF USERS
app.get('/users', (req, res) => {
    Users.find().then((users) => {
        res.status(201).json(users);
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
 });

// RETURN A USER BY USERNAME
app.get('/users/:Username', (req, res) => {
  Users.findOne({ Username: req.params.Username }).then((user) => {
      res.json(user);
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// UPDATE A USERS INFORMATION
app.put('/users/:Username', (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, { 
        $set: {
        Username: req.body.Username,
        Password: req.body.Password,
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
app.post('/users/:Username/movies/:MovieID', (req, res) => {
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
app.delete('/users/:Username/movies/:MovieID', (req, res) => {
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
app.delete('/users/:Username', (req, res) => {
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

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});