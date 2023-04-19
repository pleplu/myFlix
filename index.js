const express = require('express'),
    morgan = require('morgan');

const app = express();

app.use(morgan('common'));

let topTenMovies = [
    
    {
        title: 'The Godfather',
        director: 'Francis Ford Coppola'
    },

    {
        title: 'The Shawshank Redemption',
        director: 'Frank Darabont'
    },

    {
        title: 'Schindler\'s List',
        director: 'Steven Spielberg'
    },

    {
        title: 'Raging Bull',
        director: 'Martin Scorsese'
    },

    {
        title: 'Casablanca',
        director: 'Michael Curtiz'
    },

    {
        title: 'Citizen Kane',
        director: 'Orson Welles'
    },

    {
        title: 'Gone with the Wind',
        directors: 'Victor Fleming, George Cukor, Sam Wood'
    },

    {
        title: 'The Wizard of Oz',
        directors: 'Victor Fleming, George Cukor, Mervyn LeRoy, Norman Taurog, Richard Thorpe, King Vidor'
    },

    {
        title: 'One Flew Over the Cuckoo\'s Nest',
        director: 'Milos Forman'
    },

    {
        title: 'Lawrence of Arabia',
        director: 'David Lean'
    }

];

let logger = (req, res, next) => {
    console.log(req.url);
    next();
};
  
app.use(logger);

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});
  
app.get('/movies', (req, res) => {
    res.json(topTenMovies);
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});