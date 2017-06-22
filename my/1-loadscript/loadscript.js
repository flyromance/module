var Loader = (function() {

    function loadScript(url) {
        var script = document.createElement('script');
        // script.async = false;
        script.src = url.indexOf("?") < 0 ? (url + '?_=' + new Date().getTime()) : (url + '&_=' + new Date().getTime());
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function load(arr) {
        arr = arr || [];
        for (var i = 0; i < arr.length; i++) {
            loadScript(arr[i]);
        }
    }

    return {
        load: load
    }
})();