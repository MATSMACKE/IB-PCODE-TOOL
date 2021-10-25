function operatorReplacements(code) {
	code = code.trimStart()

	code = code.replace(/ mod /g, " % ")
	code = code.replace(/ AND /g, " && ")
	code = code.replace(/ OR /g, " || ")

	code = code.replace(/ NOT /g, " ! ")
	code = code.replace(/ <> /g, " != ")

	return code
}

function extractStrings(code) {
    code = code + "\n"
	let strings = []
	let inString = false
    let inInlineComment = false
    let inMultilineComment = false
	let currentString = ""
	let program = []

    let inDiv = false
    inDivWillEnd = false
    let inDivBrackets = 0

	for (let i = 0; i < code.length; i++) {
        if (inInlineComment || inMultilineComment) {
            if (code[i] == "\n") {
                program.push("\n ")
                inInlineComment = false
            }
            if (code[i] == "/" && code[i - 1] == "*") {
                inMultilineComment = false
            }
        }
		else if (inString) {
			if (code[i] == '"') {
				inString = false
				strings.push(currentString)
				currentString = ""
				program.push(code[i])
			}
			else {
				currentString = currentString + code[i]
			}
		}
		else if (code[i] == '"') {
			inString = true
			program.push(code[i])
		}
        else if (inDiv) {
            if (code[i] == "(") {
                inDivBrackets += 1
            }
            if (code[i] == ")") {
                inDivBrackets -= 1
            }
            if (inDivBrackets == 0) {
                if (inDivWillEnd && (code[i] == " " || code[i] == "\n")) {
                    program.push(" | 0 ")
                    program.push(code[i])
                    inDiv = false
                }
                else {
                    if (code[i] != " ") {
                        inDivWillEnd = true
                    }
                    program.push(code[i])
                }
            }
            else {
                program.push(code[i])
            }

        }
        else if (code[i] == 'd' && code[i + 1] == 'i' && code[i + 2] == 'v' && code[i + 3] == ' ') {
            inDiv = true
            program.push("/")
            i += 2
        }
		else {
            if (code[i] == "/" && code[i + 1] == "/") {
                inInlineComment = true
                continue
            }
            if (code[i] == "/" && code[i + 1] == "*") {
                inMultilineComment = true
                continue
            }
			program.push(code[i])
		}
	}

	if (inString) {
		error("You left a string open.")
	}



	return [program.join(''), strings]
}

let variables = {0: []}
let scope = 0
let stack = []
indent = 0

let lineNum = 1

function checkVariables(expression, lineNum) {
    if (/\w+\(.*\)/.test(expression)) {
        return true
    }
	let vars = expression.replace(/[^a-z0-9\s.]/gi, " ").trim().split(/\s/)


	for (variable in vars) {
		vars[variable] = vars[variable].replace(/\.\w+[\)(\(.*\))]?/gi, "")
		if (vars[variable] != `""` && vars[variable].match(/[0-9]+/) != vars[variable] && vars[variable] != "" && vars[variable] != " " && vars[variable] != "true" && vars[variable] != "false") {
			let validVariable = false
			let scopeIterator = scope
			while (scopeIterator >= 0) {
				for (existingVariable in variables[scopeIterator]) {
					if (variables[scopeIterator][existingVariable] == vars[variable]) {
						validVariable = true
						break
					}
				}
                scopeIterator--
			}
			
			if (!validVariable) {
				output(vars)
				error(`Variable ${vars[variable]} is not defined on line ${lineNum}`)
				return false
			}
		}
	}
	return true
}

function translateLine(line, lineNum) {
	line = line.trim();
	line = line.replace(/\s{2,}/g, " ")
	let indentWillIncrease = false
    let allSpaces = true
    for (let i = 0; i < line.length; i++) {
        if (line[i] != " ") {
            allSpaces = false
            break
        }
    }
    if (allSpaces || line == "") {
		return ""
	}
	else if (line.startsWith("if ")) {
        if (line.split(" ")[line.split(" ").length - 1] != "then") {
            error(line.split(" ")[line.split(" ").length - 1])
			error("Line " + lineNum + ": Don't forget 'then'!")
            return false
		}

        line = line.replace(/ then/g, ") {")
		line = line.replace(/ = /g, " == ")
		line = line.replace(/if /, "if (")
		stack.push("if")
		indentWillIncrease = true
	}

	else if (line.startsWith("else if")) {
		if (line.split(" ")[line.split(" ").length - 1] != "then") {
			error("Line " + lineNum + ": Don't forget your then statement!")
            return false
		}

        line = line.replace(/ then/g, ") {")
        line = line.replace(/ = /g, " == ")
        line = line.replace(/else if /, "} else if (")
		indent--
		indentWillIncrease = true
	}

	else if (line.startsWith("else")) {
		indent--
		indentWillIncrease = true
		line = "} else {"
	}

	else if (line.startsWith("loop while")) {
		stack.push("loop")
		line = line.replace(/loop /, "")
        line = line.replace(/ = /g, " == ")
		line = line.replace(/while /, "while (")
        line = line + ") {"
		indentWillIncrease = true
	}

	else if (line.startsWith("loop until")) {
		stack.push("loop")
        line = line.replace(/loop /, "")
        line = line.replace(/ = /g, " == ")
		line = line.replace(/until /, "while (!(")
        line = line + ")) {"
		indentWillIncrease = true
	}

	else if (line.startsWith("loop ")) {
		stack.push("loop")
        scope++
		variables[scope] = []
		variables[scope].push(line.split(" ")[1])
		let elements = line.replace(/loop /, "").split(/ from /)
		let loopVar = elements[0]
		elements = elements[1].split(/ to /)
		let from = elements[0]
		let to = elements[1]
		if (!checkVariables(from, lineNum)) {
			return false
		}
		if (!checkVariables(to, lineNum)) {
			return false
		}
		indentWillIncrease = true
		line = `for (let ${loopVar} = ${from}; ${loopVar} <= ${to}; ${loopVar}++) {`
	}

	else if (line.startsWith("output ")) {
		if (!checkVariables(line.replace(/output /, ""), lineNum)) {
			return false
		}
		
		line = line.replace(/output /, "output(")
		line = line + ")"
	}

	else if (line.startsWith("input ")) {
        variables[scope].push(line.split(" ")[1])
		line = line.split(" ")[1] + " = " + line.replace(/input /, "input('") + "')"

	}

    else if (line.startsWith("method ")) {
        line = line.replace(/method /, "function ") + "{"
		scope++
		variables[scope] = []
		variables[scope].push(line.match(/\(\w*\)/)[0].replace("(", "").replace(")", ""))
        stack.push("method")
    }
    else if (line.startsWith("return ")) {
        checkVariables(line.replace(/return /, ""))
    }

	else if (line.startsWith("end ")) {
		let flowEnded = line.split(" ")[1]
		let flowToEnd = stack.pop()

		if (flowEnded != flowToEnd) {
			error(`Incorrect 'end' statement: end ${flowToEnd} before ending ${flowEnded} on line ${lineNum}`)
            return false
		}

		indent--

		line = "}"
	}

	else {
        if (line.startsWith("[") || line.startsWith("{") || line.startsWith("}") || line.startsWith("]")) {
            return line
        }
		if (line.match( /\w+\(/ )) {
			line = line
		}
		else if (!(line.match("=")) && !(line.match(/\(/))) {
			error(`Line ${lineNum} is gibberish.`)
            return false
		}

		else if(!(line.split(" ")[1] == "=") && !(/\w+\(/.test(line))) {
			error(`Invalid variable definition on line ${lineNum}`)
            return false
		}

		variables[scope].push(line.split(" ")[0])
	}

	for (let i = 0; i < indent; i++) {
		line = "    " + line
	}

	if (indentWillIncrease) {
		indent++
	}

	return line
}

function compile(code) {
    let program = code

    let separatedProg = extractStrings(program)

    program = separatedProg[0]
    strings = separatedProg[1]

    console.log(program);

    program = operatorReplacements(program)

    let lines = program.split("\n")

    for (let i = 0; i < lines.length; i++) {
        lines[i] = translateLine(lines[i], i + 1)
        if (lines[i] === false) {
            return false
        }
    }

    code = lines.join("\n")

    lines = []

    let inString = false
    let nextString = 0

    for (let i = 0; i < code.length; i++) {
        if (code[i] == '"' && !inString) {
            lines.push(code[i])
            lines.push(strings[nextString++])
            inString = true
        }
        else {
            lines.push(code[i])
            inString = false
        }
        
    }

    code = lines.join("")

    console.log(code);

    return code
}