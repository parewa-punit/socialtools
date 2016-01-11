$(window).load(function() {
  var width = $(".output").width();
  var height = $(".output").height();

  var url = $(".output #original").val();

  window.location.href = "/download/" + url + "/" + width + "/" + height;
});
