function replaceCss(css_code) {
    var EXPRESSION_DEFINER = [";", ":", "(", ")", ","];
    var parsedcss = css_code;
    var new_css = parsedcss;
    var finished_operation_code = [];
    var regexp = new RegExp(' [+-/*] ', 'g');
    var match;
    while ((match = regexp.exec(parsedcss)) !== null) {
        var index = match.index;
        var start = 0, end = 0;
        var current_index = index - 1;
        while (start == 0) {
            var char = parsedcss.substr(current_index, 1);
            if (EXPRESSION_DEFINER.indexOf(char) != -1) {
                start = current_index + 2;
                break;
            }
            if (current_index == 0) {
                break;
            }
            current_index--;
        }
        current_index = index + 2;
        while (end == 0) {
            var char = parsedcss.substr(current_index, 1);
            if (EXPRESSION_DEFINER.indexOf(char) != -1) {
                end = current_index - 1;
                break;
            }
            if (current_index == parsedcss.length) {
                break;
            }
            current_index++;
        }
        var begin_code = parsedcss.substr(0, start);
        var end_code = parsedcss.substring(end + 1, parsedcss.length);
        var rawoperationcode = parsedcss.substring(start - 1, end + 1);
        var operationcode = "calc(" + rawoperationcode + ")";
        if (finished_operation_code.indexOf(rawoperationcode) == -1) {
            new_css = new_css.replace(rawoperationcode, operationcode);
        }
        else {
            break;
        }
        finished_operation_code.push(rawoperationcode);
    }
    new_css = new_css.replace(/\$(\w+)\s*:/g, "--$1:");
    new_css = new_css.replace(/\$(\w+)/g, "var(--$1)");
    return new_css;
}
var style1 = document.querySelector("style");
async function runAcss(filename) {
    var code = replaceCss(await loadFile(filename));
    style1.innerHTML = code;
}
async function loadFile(filename){
    let response = await fetch(`/${filename}`)
    let data = await response.text()
    return await data
} 

runAcss("style.acss")