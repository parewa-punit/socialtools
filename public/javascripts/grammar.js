var problems = [
    {
        question : "Never neglect the ideals of elders, rather always ........ them.",
        answers : [
            "A) Follow",
            "B) Cherish",
            "C) Praise",
            "D) Grasp"
        ]
    },
    {
        question : "I ............ tennis every Sunday morning.",
        answers : [
            "A) play",
            "B) am playing",
            "C) playing",
            "D) am play"
        ]
    },
    
];
    
problems.forEach(function (problem, index) {
    var lineHeight = 40;
    var top = lineHeight;
        
    var QApadding = 100;
        
    $("#canvas").append("<div class='overlay' style='top:" + top + "px; left: 50px'><h1>" + problem.question + "</h1></div>");
        
    top += QApadding;
        
    problem.answers.forEach(function (answer) {
        top += lineHeight;
        $("#canvas").append("<div class='overlay' style='top:" + top + "px; left: 50px'><h3>" + answer + "</h3></div>");
    });
        
    $("#canvas").append("<div class='overlay watermark' style='bottom: 20px; right: 40px'><h4>educationtopia.net</h4></div>");
    
    $("#exportContainer").html($("#wrapper").html());

    var html = $("#exportContainer").html();
    var width = $("#exportContainer").width();
    var height = $("#exportContainer").height();
    var name = "grammar-image" + index;
        
    $.post("/", { html : html, width: width, height: height, name : name }, function (error, response) {
    });

    $(".overlay").remove();
});

 
 