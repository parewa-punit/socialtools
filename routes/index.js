var express = require('express');
var router = express.Router();
var fs = require('fs');
var spawn = require('child_process').spawn;
var graph = require('fbgraph');


// this should really be in a config file!
var conf = {
    client_id: '839501089498457'
    , client_secret: '0078b2f496ec51059ce5628a6aab3123'
    , scope: 'email, user_about_me, user_birthday, user_location, publish_actions, user_managed_groups'
    , redirect_uri: 'http://localhost:1337/auth/facebook'
};


/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});


router.get('/auth/facebook', function (req, res) {
    console.log(graph);
    // we don't have a code yet
    // so we'll redirect to the oauth dialog
    if (!req.query.code) {
        var authUrl = graph.getOauthUrl({
            "client_id": conf.client_id
            , "redirect_uri": conf.redirect_uri
            , "scope": conf.scope
        });
        
        if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
            res.redirect(authUrl);
        } else {  //req.query.error == 'access_denied'
            res.send('access denied');
        }
        return;
    } 
    // code is set
    // we'll send that and get the access token
    graph.authorize({
        "client_id": conf.client_id
        , "redirect_uri": conf.redirect_uri
        , "client_secret": conf.client_secret
        , "code": req.query.code
    }, function (err, facebookRes) {
        res.redirect('/UserHasLoggedIn');
    });
});

// user gets sent here after being authorized
router.get('/UserHasLoggedIn', function (req, res) {
    var wallPost = {
        message: "How are you supposed to concentrate on work when your country is burning? :("
    };
    
    //graph.post("/feed", wallPost, function (err, fbres) {
    //    // returns the post id
    //    res.send(wallPost.message);
    //});
});

router.post('/', function (req, res) {
    var html = req.body.html;
    var height = req.body.height;
    var width = req.body.width;
    var name = req.body.name;
    
    var filename = "public/html/" + name + ".html";
    var imagelocation = "html/" + name + ".jpg";

    fs.writeFileSync(filename, html.toString());
    var wkhtmltoimage = spawn("wkhtmltoimage", [
        "--width", width, 
        "--height", height, 
        "localhost:3000/html/" + name + ".html", "public/" + imagelocation]);
   
    wkhtmltoimage.stdout.on('data', function (data) {
        console.log("stdout console output");
     //   res.send("stdout");
    });
    
    wkhtmltoimage.stderr.on('data', function (data) {
        console.log(data);
    });
    
    wkhtmltoimage.on('exit', function (code) {
        console.log("exit console output");
        res.send(imagelocation);
    });

    
});


module.exports = router;