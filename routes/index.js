var express = require('express');
var router = express.Router();
var fs = require('fs');
var formidable = require('formidable');
var spawn = require('child_process').spawn;
var graph = require('fbgraph');
var util = require("util");
var config = require("../config.js");
var gm = require('gm').subClass({imageMagick: true});
var path = require('path');
var wkhtmltoimage = require('wkhtmltoimage');


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

    var download_url = "localhost:" + config.port + "/watermark/" + file_name;

    console.log("Download url is ", download_url);
    console.log("Width is ", width);

    var wkhtmltoimage = spawn("wkhtmltoimage", [
       "--width", width,
       download_url, save_location]);

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
    var rotate;
    form.parse(req, function(err, fields, files) {
        rotate = fields.rotate == "on";
    });
    form.on('error', function(err) {
        console.error(err);
    });
    form.on('progress', function(bytesReceived, bytesExpected) {
        var percent_complete = (bytesReceived / bytesExpected) * 100;
        console.log(percent_complete.toFixed(2));
    });
    form.on('end', function(err, fields, files) {

      //  console.log("Fields", fields);
      //  console.log("Files", files);
      /* Temporary location of our uploaded file */
      var temp_path = this.openedFiles[0].path;
      /* The file name of the uploaded file */
      var file_name = this.openedFiles[0].name;

      /* Location where we want to copy the uploaded file */
      var new_location = 'public' + path.sep + 'images' + path.sep;
      var resources_location = 'public' + path.sep + 'resources' + path.sep;

      var upload_location = new_location + file_name;
      var save_location = new_location + "watermark-" + file_name;

      fs.readFile(temp_path, function(err, data) {
        fs.writeFile(upload_location, data, function(err) {
            fs.unlink(temp_path, function(err) {
                if (err) {
                    console.error(err);
                } else {

                    console.log("Rotate", rotate);
                    var directory = path.dirname(__dirname);

                    upload_location = directory + path.sep + upload_location;
                    save_location = directory + path.sep + save_location;
                    logo_location = directory + path.sep + resources_location + path.sep + "logo.png";

                    gm(logo_location)
                    .size(function(err, size){
                        var logo_original_width = size.width;
                        var logo_original_height = size.height;

                        if(rotate) {
                            gm(upload_location)
                            .rotate("white", 90)
                            .write(upload_location, function(err){
                                gm(upload_location)
                                .size(function(err, size){
                                    var logo_width = Math.floor(size.width/6);
                                    var logo_height = Math.floor(logo_width * logo_original_height/logo_original_width);
                                    var logo_x = size.width - logo_width - 10;
                                    var logo_y = 10;
                                    this.draw(['image Over ' + logo_x + ',' + logo_y + ' ' + logo_width + ',' + logo_height + ' \"' + logo_location + '\"'])
                                    .rotate("white", 270)
                                    .write(save_location, function(err){
                                        res.sendfile('public/images/' + "watermark-" + file_name);
                                    });
                                });
                            });
                        } else {
                            gm(upload_location)
                            .size(function(err, size){
                                    var logo_width = Math.floor(size.width/6);
                                    var logo_height = Math.floor(logo_width * logo_original_height/logo_original_width);
                                    var logo_x = size.width - logo_width - 10;
                                    var logo_y = 10;
                                    gm(upload_location)
                                    .draw(['image Over ' + logo_x + ',' + logo_y + ' ' + logo_width + ',' + logo_height + ' \"' + logo_location + '\"'])
                                    .write(save_location, function(err){
                                        res.sendfile('public/images/' + "watermark-" + file_name);
                                    });
                            });
                        }
                    });

                    //     gm(upload_location)
                    //     .rotate("white", 90)
                    //     .write(upload_location, function(err) {
                    //         gm(upload_location)
                    //         .size(function (err, size) {
                    //             if (!err) {
                    //                 var logo_width = Math.floor(size.width/6);
                    //                 var logo_height = Math.floor(logo_width * logo_original_height/logo_original_width);
                    //                 var logo_x = size.width - logo_width - 10;
                    //                 var logo_y = 10;
                    //                 gm(upload_location)
                    //                 .draw(['image Over ' + logo_x + ',' + logo_y + ' ' + logo_width + ',' + logo_height + ' \"' + logo_location + '\"'])
                    //                 .write(save_location, function (err) {
                    //                     gm(save_location)
                    //                     .rotate("white", 270)
                    //                     .write(save_location, function(err){
                    //                         res.download('public/images/' + "watermark-" + file_name);
                    //                     })
                    //                 });
                    //             }
                    //         });
                    //     });
                    // });
                       //     res.redirect("getdimensions/" + file_name);

                           // obtain the size of an image




                      //  res.redirect("/getdimensions/" + file_name);
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
