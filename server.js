var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session')({
    secret: "ssssssssssssshhhh",
    resave: false,
    autoSave: true,
    saveUninitialized: true
});
var app = express();

// Body Parsing
app.use(bodyParser.urlencoded({extended: true}));

// Set up static folder
app.use(express.static(path.join(__dirname, './static')));

// Set up views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// Spotify API
var client_id = "1e530d7e14fc4d2986e6d3554dd3bb83";
var client_secret = "3c673f6446cd418f894b78e9d0d77a8c";
var SpotifyWebAPI = require('spotify-web-api-node');
var spotifyAPI = new SpotifyWebAPI({
    clientId: client_id,
    clientSecret: client_secret
});

// Variables
var seshes = [];
var messages = [];
class Message {
    constructor (user, msgStr) {
        this.user = user;
        this.message = msgStr;
    }
}

// Routes
app.get('/', function(req, res) {
    res.render('index');
})

app.post('/createSesh', function(req, res) {
    let sesh_name = req.body.seshName;
    seshes.push(sesh_name);
    messages[sesh_name] = [];
    res.json(sesh_name);
})

app.get('/sesh/:id', function(req, res) {
    console.log(req.params.id)
    res.render('seshroom');
});

// Server
var server = app.listen(8000);
var io = require('socket.io')(server);

io.on('connection', function(socket) {
    if (seshes.length > 0) {
        io.emit('sesh_opened', {
            seshName: seshes[0]
        })
    }

    socket.on('close_sesh', function() {
        seshes.pop();
        console.log(seshes.length);
        io.emit('sesh_closed');
    })

    socket.on('song_search', function(data) {
        let query = data.query;
        spotifyAPI.clientCredentialsGrant().then(
            function(data) {
                console.log('The access token expires in '+ data.body['expires_in']);
                console.log('The access token is '+ data.body['access_token']);
        
                // Save the access token so that it's used in future calls
                spotifyAPI.setAccessToken(data.body['access_token']);
                spotifyAPI.searchTracks(query).then (
                    function(data) {
                        let items = data.body.tracks.items;
                        let idx = Math.floor(Math.random()*9)
                        let song = items[idx]
                        // console.log(song, song.id)
                        io.emit('song_result', {
                            id: song.id
                        });
                    }, function(error) {
                        console.log(error);
                    }
                )
            },
            function(error) {
                console.log("something went wrong when retrieving an access token", error);
            }
        );
    });

    socket.on('new_user', function(data) {
        console.log(data.username);
        socket.emit('update_messages', {
            messages: messages
        });
        socket.emit('user_created');
    });

    socket.on('new_message', function(data) {
        let new_message = new Message(data.username, data.messageStr);
        messages.push(new_message);
        io.emit('update_messages', {
            messages: messages
        });
    });
});