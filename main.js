const codeEditor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    theme: "pastel-on-dark",
    mode: "pseudocode"
})

codeEditor.setSize("100%", "100%")

function output(toOutput) {
    let element = document.createElement("p")
    element.innerHTML = toOutput
    element.setAttribute("class", "outputLine")
    document.querySelector(".runner").appendChild(element)
}

function error(errorCode) {
    let element = document.createElement("p")
    element.innerHTML = errorCode
    element.setAttribute("class", "error")
    document.querySelector(".runner").appendChild(element)
}

function input(text) {
    let inputted = prompt(text, "Input")
    output('Inputted: ' + inputted)
    return inputted
}

function runCode() {
    let compiledCode = compile(codeEditor.getValue())

    if (compiledCode === false) {
        console.log("VALUE");
        return
    }

    console.log(compiledCode)

    var codeToRun = new Function(compiledCode)

    codeToRun()
}

document.querySelector("#run").addEventListener("click", function () {
    runCode()
}, {passive: true})
