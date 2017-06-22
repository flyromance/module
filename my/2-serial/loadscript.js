function loadScript(url, callback) {
    var script = document.createElement('script');

    if (script.readyState) {
        script.onreadystatechange = function() {
            if (script.readyState === 'complete' || script.readyState === 'loaded') {
                script.onreadyStateChange = null;
                callback();
            }
        }
    } else {
        script.onload = function() {
            script.onload = null;
            callback();
        }
    }
    script.src = url + "?_=" + new Date().getTime();
    document.getElementsByTagName('head')[0].appendChild(script);
}



function loadQueue(arr) {
    var modelNum = arr.length;

    function loadNext() {
        var item = arr.shift();
        if (item) {
            loadScript(item, loadNext);
        }
    }
    loadNext();
}