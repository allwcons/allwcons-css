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



HTMLElement.prototype.get_css_var = function(Var){
	return getComputedStyle(this).getPropertyValue(Var)
}

HTMLElement.prototype.set_css_var = function(Var,value){
	return this.style.setProperty(Var,value)
}

let if_pattern = /if @(\w+) [?]\s*(.*)\s*>\s*(\w+)[^;)]*/g


function if_else_template(_if,_else,key){
	return `\n--if_${key}:${_if};--else_${key}:${_else};\n`
}
function if_else_var_template(key){
	return `var(--else_${key},var(--if_${key}))`
}


function compileAcss(code){
	let SELECTOR_DEFINER = /}(.|\n)[^{]*/g
	let match;
	let selectors = []
	let newcode = code
	while ((match = if_pattern.exec(code)) != null){
		let data = {}
		let key = uuidv4();
		let _value = match[0]
		let _event = match[1]
		let _if = match[2]
		let _else = match[3]
		let length = _value.length


		let index = match.index
		let start = null;
		let current_index = index
		let var_code = if_else_var_template(key)

		code = code.splice(index,length,var_code)

		let PROPERTY_DEFINER = ["\s","\n",";"]
		while (!start){
			let char = code.substr(current_index,1);
			if (PROPERTY_DEFINER.indexOf(char) != -1){
				start = current_index
				break
			}
			current_index--;
		}

		let if_else_code = if_else_template(_if,_else,key)
		code = code.splice(start,0,if_else_code)

		let new_start = null
		current_index = start
		let selector = ""
		let status = false
		while (!new_start){
			let char = code.substr(current_index,1)
            if(char == "}"){
				status = false
				break
			}
			if(status){
				selector = char + selector
			}
			if(char == "{"){
				status = true
			}

			if(current_index == 0){
				break
			}
			current_index--;
		}
		selector = selector.trim()
		data = {_event,_if,_else,selector,key}
		selectors.push(data)

	}
	return [code,selectors]
}
function installAcss(css_code){
    let r = compileAcss(css_code)
    let selectors = r[1]

    let builtin_event = {
        "mousedown":"mouseup",
        "mouseup":"mousedown"
    }

    for(let i = 0;i<selectors.length;i++){
        let state = selectors[i]
        let query = state.selector
        let elts = document.querySelectorAll(query)
        for(let j = 0;j<elts.length;j++){
            elts[j].addEventListener(state._event,onmainevent(state._if,state._else,state.key))
            elts[j].addEventListener(builtin_event[state._event],onsecondaryevent(state._if,state._else,state.key))
        }
    }

    function onmainevent(_if,_else,key){
        function handler(e){
            let elt = e.target
            elt.set_css_var(`--else_${key}`, "unset")
            elt.set_css_var(`--if_${key}`, _if)
        }
        return handler
    }

    function onsecondaryevent(_if,_else,key){
        function handler(e){
            let elt = e.target
            elt.set_css_var(`--if_${key}`, "unset")
            elt.set_css_var(`--else_${key}`, _else)
        }
        return handler
    }
    return r[0]
}


var style1 = document.querySelector("style");
async function runAcss(filename) {
    var code = replaceCss(await loadFile(filename));
    code = installAcss(code)
    style1.innerHTML = code;
}
async function loadFile(filename){
    let response = await fetch(`/${filename}`)
    let data = await response.text()
    return await data
} 


if (!String.prototype.splice) {
    /**
     * {JSDoc}
     *
     * The splice() method changes the content of a string by removing a range of
     * characters and/or adding new characters.
     *
     * @this {String}
     * @param {number} start Index at which to start changing the string.
     * @param {number} delCount An integer indicating the number of old chars to remove.
     * @param {string} newSubStr The String that is spliced in.
     * @return {string} A new string with the spliced substring.
     */
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}

module.exports = runAcss;

// runAcss("style.acss")