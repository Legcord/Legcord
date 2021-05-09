exports.Version = "DevBuild";
  
exports.addStyle = function(styleString) {
 const style = document.createElement('style');
 style.textContent = styleString;
 document.head.append(style);
};

exports.addScript = function(scriptString) {
  var script = document.createElement('script');
  script.textContent = scriptString;
  document.body.append(script);
};