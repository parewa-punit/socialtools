$(document).ready(function() {
  var width = $(".output").width();
  var height = $(".output").height() + 40;

  var url = $(".output #original").val();

  window.location.href = "/download/" + url + "/" + width + "/" + height;
});


