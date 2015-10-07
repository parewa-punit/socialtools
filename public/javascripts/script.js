$(document).ready(function () {

    $(".overlay").wrapInner("<div class='content' contenteditable='true'></div>");
    $(".overlay").prepend("<div class='ui-widget-header'></div>");

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

    $(".overlay").draggable({
        handle: ".ui-widget-header", 
        stop: function () {
            updatePreview();
        } });
   

    //var editor = new MediumEditor('.content', {
    //    buttonLabels: 'fontawesome',
    //    buttons: ['bold', 'italic', 'underline', 'anchor', 'header1', 'header2', 'quote'],
    //    firstHeader: 'h1',
    //    secondHeader: 'h2'
    //});


    $("#export").click(function (){
        $("#exportContainer").html($("#wrapper").html());
        var html = $("#wrapper").html();
        var width = $("#wrapper").width();
        var height = $("#wrapper").height();
        var name = "image";

        $.post("/", { html : html, width: width, height: height, name : name }, function (error, response) {
            console.log(error);
            console.log(response);
        });
    })
    
    function updatePreview() {
        $("#exportContainer").html($("#wrapper").html());
    }

    $("#preview").click(function () {
        updatePreview();
    });
});
