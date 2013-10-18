(function(exports) {
    $(function() {
        var filePath = null;
        var firstTimePos = true;
        var initPage = (function() {
            var $pages = $('.page');

            return function(page) {
                $pages.hide();
                $('.page' + '.__' + page).show();
            };
        })();

        initPage('file-chooser');
        $('.choose-file').click(function() {
            var $file = $('.file');

            $file.click();
            $file.change(function() {
                initPage('logger');
                filePath = $file.val();
                $('.full-path').text(filePath);

                exports.watcher(filePath).change(function(err, logs) {
                    if (err) throw err;
                    var html = '';
                    logs.forEach(function(log) {
                        var labelClass;

                        log.level = log.level || '';

                        switch (log.level.toLowerCase()) {
                            case 'trace':
                                labelClass = 'label-default'
                                break;

                            case 'debug':
                                labelClass = 'label-primary'
                                break;

                            case 'info':
                                labelClass = 'label-info'
                                break;

                            case 'warn':
                                labelClass = 'label-warning'
                                break;

                            case 'error':
                                labelClass = 'label-danger'
                                break;

                            default:
                                labelClass = 'label-default'
                        }

                         log.data = log.data.map(function(str) {
                            try {
                                return '<pre><code>' + hljs.highlight('javascript', JSON.stringify(JSON.parse(str), null, '    ')).value + '</code></pre>';
                            } catch (err) {
                                return str
                            }
                        }).join('<br>');

                        log.label = labelClass;

                        html += Mustache.render($('.tpl.__log').html(), {
                            log: log
                        });
                    });
                    if ((!firstTimePos && window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                        setTimeout(function() {
                            window.scrollTo(window.scrollX, document.body.scrollHeight)
                        }, 1);
                    } else if (firstTimePos) {
                        firstTimePos = false;
                    }
                    $('.logs').html(html);
                });
            });
        });
        $('.reload').click(function() {
            window.location.reload();
        });
    });
})(this);
