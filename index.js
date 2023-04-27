const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

let users = [

    {
        id: 1,
        name: 'Steve',
        favoriteMovie: []
    },

    {
        id: 2,
        name: 'Tyler',
        favoriteMovie: []
    },

    {
        id: 3,
        name: 'Sarah',
        favoriteMovie: []
    }
];

let movies = [
    
    {
        title: 'The Godfather',
        genres: {
            name: 'Crime',
            description: 'Crime films, in the broadest sense, are a cinematic genre inspired by and analogous to the crime fiction literary genre.'
        },
        description: 'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.',
        directors: {
            name: 'Francis Ford Coppola',
            born: 'April 7th, 1939',
            bio: 'Francis Ford Coppola is an American film director, producer, and screenwriter.'
            
        }
    },

    {
        title: 'The Shawshank Redemption',
        genres: {
            name: 'Drama',
            description: 'In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone.'
        },
        description: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
        directors: {
            name: 'Frank Darabont',
            born: 'January 28, 1959',
            bio: 'Frank Árpád Darabont is a French-born American film director, screenwriter and producer.'
        }
    },

    {
        title: 'Schindler\'s List',
        genres: {
            name: 'History',
            description: 'A historical film is a fiction film showing past events or set within a historical period.'
        },
        description: 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.',
        directors: {
            name: 'Steven Spielberg',
            born: 'December 18, 1946',
            bio: 'Steven Allan Spielberg KBE is an American filmmaker.'
        }
    },
];

let logger = (req, res, next) => {
    console.log(req.url);
    next();
};
  
app.use(logger);

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});
 
// CREATE
app.post('/users', (req, res) => {
    const newUser = req.body;

    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send('Name field required.');
    }
});

// UPDATE
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('User not found.')
    }
}); 

// CREATE
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovie.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user's favorites`);
    } else {
        res.status(404).send('User not found.')
    }
}); 

// DELETE 
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovie = user.favoriteMovie.filter(title => title!==movieTitle)
        res.status(200).send(`${movieTitle} has been removed from user's favorites`);
    } else {
        res.status(404).send('User not found.')
    }
}); 

// DELETE 
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        users = users.filter(user => user.id != id);
        res.status(200).send(`User ${id} has been deleted`);
    } else {
        res.status(404).send('User not found.')
    }
}); 

// READ
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// READ
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title);

    if (movie) {
        res.status(200).json(movie); 
    } else {
        res.status(404).send('Could not find that movie.');
    }
});

// READ
app.get('/movies/genres/:genreName', (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.genres.name === genreName).genres;

    if (genre) {
        res.status(200).json(genre); 
    } else {
        res.status(404).send('Could not find that genre.');
    }
});

// READ
app.get('/movies/directors/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.directors.name === directorName).directors;

    if (director) {
        res.status(200).json(director); 
    } else {
        res.status(404).send('Could not find that genre.');
    }
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});