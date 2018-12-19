$(document).ready(function() {
    var socket = io();
    var messages = []
    var username = ""
    $("[data-toggle=popover]").popover();

    $("#create-form").on('submit', function(event) {
        event.preventDefault();
        let data = $(this).serializeArray();
        console.log(data);
        username = data[1].value;
        let seshD = {
            seshName: data[0].value,
            username: username
        }
        $.ajax({
            type: 'POST',
            url: '/createSesh',
            data: seshD,
            success: function(data) {
                document.getElementById("sesh-hdr").innerHTML= data;
                setupSeshRoom();
            }
        });
    });

    $("#close-sesh").on('click', function(event) {
        event.preventDefault();
        socket.emit('close_sesh');
    });

    $("#text-img").on('click', function(event) {
        event.preventDefault();
        console.log("Need to show text messages");
        $("#sidebar").toggleClass('active');
    });

    $("#message-form").submit(function(event) {
        event.preventDefault();
        let data = $(this).serializeArray();
        let messageStr = data[0].value;
        socket.emit('new_message', {
            username: username,
            messageStr: messageStr
        })
    });

    // Spotify search for videos
    $("#search-form").submit(function(event) {
        event.preventDefault();
        let data = $(this).serializeArray();
        socket.emit('song_search', {
            query: data[0].value
        })
    });

    // Socket functions
    socket.on('song_result', function(data) {
        let song_id = data.id;
        document.getElementById("sp-widget").src = "https://open.spotify.com/embed/track/"+ song_id;
        $("#sp-widget").show();
    })

    socket.on('sesh_opened', function(data) {
        document.getElementById("sesh-hdr").innerHTML= data.seshName;
        if (username == "") {
            username = prompt("Please enter your name to join the sesh");
            if (username != null) {
                socket.emit('new_user', {
                    username: username
                });
            }    
        } else {
            setupSeshRoom();
        }
    })

    socket.on('sesh_closed', function() {
        setupView();
    })

    // Messages - Chat Room
    socket.on('user_created', function() {
        // Do something to set up the sesh room
        setupSeshRoom();
    })

    socket.on('update_messages', function(data) {
        let messages = data.messages;
        let html = ""
        for (message in messages) {
            let thisMsg = messages[message]
            html += ("<div class='row'><div class='col'><b>"+ thisMsg.user +
                "</b></div></div><div class='row'><div class='col'>"+ 
                thisMsg.message +"</div></div>");
        }
        document.getElementById("messages").innerHTML = html;
    });

    function setupView() {
        $("#nav-bar-top").hide();
        $("#seshroom").hide();
        $("#sp-widget").hide();
        $("#home-screen").show();
    };

    function setupSeshRoom() {
        $("#nav-bar-top").show();
        $("#seshroom").show();
        // $("#sp-widget").hide();
        $("#home-screen").hide();
    }

    setupView();
});