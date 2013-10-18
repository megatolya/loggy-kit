(function(exports) {
    var started = false,
        callbacks = [],
        oldContents = null;
        request = require('request'),
        chokidar = require('chokidar'),
        processFunc = null,
        parser = exports.parser;

    var isUrl = exports.isUrl = /(http|ftp|https):\/\/[\w\-_]+([\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
    exports.watcher = function(logPath) {
        function invokeCallbacks() {
            processFunc(logPath, function(err, logs) {
                callbacks.forEach(function(callback) {
                    typeof callback === 'function' && callback(err, logs);
                });
            });
        }

        if (!started) {
            started = true;
            if (isUrl.test(logPath)) {
                setInterval(function() {
                    request({
                        url: logPath,
                        encoding: "utf8"
                    }, function (err, res, body) {
                        if (err) throw err;

                        if (oldContents != body) {
                            oldContents = body;
                            invokeCallbacks();
                        }
                    });
                }, 1000);
                processFunc = parser.processURL.bind(parser);
            } else {
                var watcher = chokidar.watch(logPath);

                watcher.on('change', function() {
                    invokeCallbacks();
                });
                processFunc = parser.processFile.bind(parser);
            }
        }

        return {
            change: function(callback) {
                callbacks.push(callback);
                invokeCallbacks();
            },
            invoke: invokeCallbacks
        };
    };
})(this);
