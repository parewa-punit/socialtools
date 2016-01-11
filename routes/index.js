var express = require('express');
var router = express.Router();
var fs = require('fs');
var formidable = require('formidable');
var spawn = require('child_process').spawn;
var graph = require('fbgraph');
var util = require("util");
var config = require("../config.js");

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

router.get('/sonu', function(req, res){
    res.render('sonu', {title : "Watermark Tool"});
});

router.get("/upload/:url", function(req, res, next){
    res.render("tcp", {
        url: "/images/" + req.params.url,
        original: req.params.url
     });
});

router.get("/download/:url/:width/:height", function(req, res, next){
    var file_name = req.params.url;
    var width = req.params.width;
    var height = req.params.height;

    var watermark_file_name = "watermark-" + file_name;
    var save_location = "public/images/" + watermark_file_name;


    var wkhtmltoimage = spawn("wkhtmltoimage", [
         "--width", width,
         "--height", height,
        "localhost:" + config.port + "/watermark/" + file_name, save_location]);

    wkhtmltoimage.stdout.on('data', function (data) {
        console.log("stdout console output");
     //   res.send("stdout");
    });

    wkhtmltoimage.stderr.on('data', function (data) {
        console.log(data);
    });

    wkhtmltoimage.on('exit', function (code) {
        console.log("exit console output");
        res.download("public/images/" + watermark_file_name);
    });
});

router.get("/getdimensions/:original", function(req, res, next){
    var original = req.params.original;
    var url = "/images/" + original;

    console.log(original);

    res.render("tcp", {url: url, original: original});
})

router.get("/watermark/:original", function(req, res, next){
    var original = req.params.original;
    var url = "/images/" + original;
    res.render("tcp-no-redirect", {url: url, original: original});
});

router.post("/upload", function(req, res, next){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        // `file` is the name of the <input> field of type `file`
        // console.log(files);
        // res.writeHead(200, {'content-type': 'text/plain'});
        // res.write('received upload:\n\n');
        // res.end(util.inspect({fields: fields, files: files}));
    });
    form.on('error', function(err) {
        console.error(err);
    });
    form.on('progress', function(bytesReceived, bytesExpected) {
        var percent_complete = (bytesReceived / bytesExpected) * 100;
        console.log(percent_complete.toFixed(2));
    });
    form.on('end', function(fields, files) {
        /* Temporary location of our uploaded file */
        var temp_path = this.openedFiles[0].path;
        /* The file name of the uploaded file */
        var file_name = this.openedFiles[0].name;
        /* Location where we want to copy the uploaded file */
        var new_location = 'public/images/';

        fs.readFile(temp_path, function(err, data) {
            fs.writeFile(new_location + file_name, data, function(err) {
                fs.unlink(temp_path, function(err) {
                    if (err) {
                        console.error(err);
                        } else {


                        res.redirect("/getdimensions/" + file_name);
                    }
                });
            });
        });
    });


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

    var filename = "public/export/html/" + name + ".html";
    var imagelocation = "export/image/" + name + ".jpg";

    fs.writeFileSync(filename, html.toString());
    var wkhtmltoimage = spawn("wkhtmltoimage", [
        "--width", width,
        "--height", height,
        "localhost:3000/export/html/" + name + ".html", "public/" + imagelocation]);

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
