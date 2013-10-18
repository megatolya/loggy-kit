window.parser = {};
(function(exports) {
    var fs = require("fs");
    var request = require("request");

    // TODO
    var searchDateRegex = /^[\d]{4}-[\d]{2}-[\d]{2}\s[\d]{2}:[\d]{2}:[\d]{2}/;
    var searchObjRegex = /\{".+}/;
    var searchArrRegex = /\[.+\]/; 

    /**
    * Преобразование линии текста в объект с данными
    * @param {String} textLine
    * @return {Object} с ключами {Date} date, {String} module, {String} level, {Array} data (может состоять из строк и объектов)
    */
    function parseLine(textLine) {
        var parts = textLine.split("\t");

        // заменяем пробелы во второй части на табуляцию
        parts[1] = parts[1].replace(/\s+/, "\t").split("\t");
        parts.splice(1, 1, parts[1][0], parts[1][1]);

        var originalText = parts[3];

        var outputTextChunks = [];

        [searchObjRegex, searchArrRegex].forEach(function (regex) {
            var matches = originalText.match(regex);
            var index, obj;

            if (matches) {
                index = originalText.indexOf(matches[0]);
                if (index) {
                    outputTextChunks.push(originalText.substr(0, index));
                    originalText = originalText.substr(index);
                }

                try {
                    obj = JSON.parse(matches[0]);
                    outputTextChunks.push(JSON.stringify(obj));
                } catch (ex) {
                    outputTextChunks.push(matches[0]);
                }

                originalText = originalText.replace(matches[0], "");
            }
        });

        if (originalText.length) {
            outputTextChunks.push(originalText);
        }

        return {
            date: parts[0],
            module: parts[1],
            level: parts[2],
            data: outputTextChunks
        };
    }

    /**
    * Преобразование текста лога в итоговый массив объектов
    * @param {String} text
    * @return {Array}
    */
    function parseLogData(text) {
        var output = [];
        var prevParts = [];

        // проходим по всем строкам файла
        // как только строка начинается с даты вида "xxxx-xx-xx xx:xx:xx" предполагаем, что все, что было до этого закончилось
        // например там могли быть продолжения предыдущих строк (JSON.stringify и прочие варианты)
        text.split("\n").forEach(function (line) {
            line = line.trim();
            if (!line.length)
                return;

            if (searchDateRegex.test(line)) {
                if (prevParts.length) {
                    var prevLine = prevParts.join("");
                    output.push(parseLine(prevLine));

                    prevParts.length = 0;
                }
            }

            prevParts.push(line);
        });

        // добавляем то, что осталось после прохода forEach
        output.push(parseLine(prevParts.join("")));
        return output;
    }

    exports.processFile = function (filePath, callback) {
        fs.readFile(filePath, "utf8", function (err, fileContents) {
            if (err)
                return callback(err);

            callback(null, parseLogData(fileContents));
        });
    };

    exports.processURL = function (url, callback) {
        request({
            url: url,
            encoding: "utf8"
        }, function (err, res, body) {
            if (err)
                return callback("Problem with HTTP GET request: " + err);

            callback(null, parseLogData(body));
        });
    };
})(parser);
