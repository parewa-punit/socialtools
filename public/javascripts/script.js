function updatePreview() {
    var html = $("#wrapper").html();
    $("#exportContainer").html(html);
    localStorage.setItem("html", $("#exportContainer").html());
}

function wrap(ele) {
    $(ele).wrapInner("<div class='content' contenteditable='true'></div>");
    $(ele).prepend("<div class='ui-widget-header edit-marker'></div>");
    $(ele).prepend("<div class='ui-widget-delete edit-marker'>x</div>");
}

function makeEditable(ele){
    $(ele).resizable({
        stop: function () {
            updatePreview();
        }
    });

    $(ele).draggable({
        handle: ".ui-widget-header",
        stop: function () {
            updatePreview();
        }
    });

    CKEDITOR.inline($(ele).find(".content")[0]);
}

$(document).ready(function () {
    CKEDITOR.on('instanceCreated', function (event) {
        var editor = event.editor;

        editor.on('configLoaded', function () {

            // Remove redundant plugins to make the editor simpler.
     //       editor.config.removePlugins = 'find,flash,' +
					//'forms,iframe,image,newpage,removeformat,' +
					//'smiley,specialchar,stylescombo,templates';

            editor.config.extraPlugins = 'colorbutton,colordialog';

            // Rearrange the toolbar layout.
            editor.config.toolbarGroups = [
            //    { name: 'document', groups: ['mode', 'document', 'doctools'] },
            //    { name: 'clipboard', groups: ['clipboard', 'undo'] },
            //    { name: 'editing', groups: ['find', 'selection', 'spellchecker'] },
            //    { name: 'forms' },
                '/',
                { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
            //    { name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi'] },
           //     { name: 'links' },
              //  { name: 'insert' },
                '/',
                { name: 'styles' },
                { name: 'colors' },
             //   { name: 'colors' },
                { name: 'tools' },
                { name: 'others' },
              //  { name: 'about' }
            ];

        });

        editor.on('saveSnapshot', function () {
            updatePreview();
        });

        editor.on('key', function (){
            updatePreview();
        })
    });




    //var editor = new MediumEditor('.content', {
    //    buttonLabels: 'fontawesome',
    //    buttons: ['bold', 'italic', 'underline', 'anchor', 'header1', 'header2', 'quote'],
    //    firstHeader: 'h1',
    //    secondHeader: 'h2'
    //});


    $("#export").click(function (){
        updatePreview();
        var html = $("#exportContainer")[0].outerHTML;
        var width = $("#exportContainer").width();
        var height = $("#exportContainer").height();
        var name = "image";

        $.post("/", { html : html, width: width, height: height, name : name }, function (response) {
            window.location.href = response;
        });
    })



    $("#preview").click(function () {
        updatePreview();
    });

    $("#add-overlay").click(function () {
        var ele = $("<div class='overlay' style='top:" + 20 + "px; right: 20px'><h1>" + "If your inspirational quote contains grammatical errors, its not going to be very inspirational." + "</h1></div>").appendTo("#canvas");
        wrap(ele);
        makeEditable(ele);
    });

    $("#bg-selection img").click(function () {
        $("#canvas img").attr("src", this.src);
    });


    var html = localStorage.getItem("html");
    if (html !== null) {
        $("#wrapper").html(html);

        $("#wrapper .overlay").each(function (index, overlay) {
            makeEditable(overlay);
        });

    }

   $(".watermark-tool input[name=url]").change(function(e) {
        var url = $(".watermark-tool input[name=url]").val()
        $.get(url)
        .done(function() {
            $("#with-watermark").attr("src", url);
        }).fail(function() {
            $("#with-watermark").attr("src", "/images/invalid.png");
        })
    });

});



