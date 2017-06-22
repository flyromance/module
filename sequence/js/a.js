printReadyState(1);

new Promise(function(resolve, reject) {
    setTimeout(function() {
        resolve();
    });
}).then(function() {
    printReadyState(1.1);
});

loadScript('./js/c.js', function() {
    for (var i = 0; i < 10000000; i++) {

    }

    printReadyState(4);
    setTimeout(function() {

        printReadyState(6);
    });
});