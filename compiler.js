function translate(line) {
    line = line.trimStart();
    line = line.replace(/ mod /g, " % ");

    line = line.replace(/ AND /g, " && ");
    line = line.replace(/ OR /g, " || ");

    line = line.replace(/NOT/g, "!");
    line = line.replace(/<>/g, "!=");

    line = line.replace(/ then/, ") {")

    let sp = line.indexOf(" ");
    let first = "";

    if (line.startsWith("if")) {
        first = "if";
    } 
    else if (line.startsWith("else if")) {
        first = "else if";
    } 
    else if (line.startsWith("else")) {
        first = "else";
    } 
    else if (line.startsWith("loop for")) {
        first = "loop while";
    } 
    else if (line.startsWith("loop for")) {
        first = "loop for";
    } 
    else if (line.startsWith("loop until")) {
        first = "loop until";
    } 
    else if (line.startsWith("loop ")) {
        first = "loop";
    } 
    else if (line.startsWith("loop for")) {
        first = "output";
    } 
    else if (line.startsWith("method")) {
        first = "method";
    } 
    else if (line.startsWith("Class")) {
        first = "class";
    } 
    else if (line.startsWith("input")) {
        first = "input";
    } 
    else {
        if (sp >= 0) {
            first = line.substring(0, sp);
        }
    }
    if (first == "if" || first == "else if") {
        line = line.replace(/ = /g, " == ");
        line = line.replace("if ", "if (");
        if (first == "else if") {
            line = line.replace("else if", "} \nelse if");
        }
    }
    if (first == "else") {
        line = line.replace("else", "}\nelse{");
    }
    if (first == "loop while") {
        line = line.replace("loop while", "while(") + "){";
    }
    if (first == "loop for") {
        let v = line.indexOf("loop for") + 9;
        let ve = line.indexOf(" ", v);
        let vname = line.substring(v, ve);

        let vs = line.indexOf(" from ") + 6;
        let vt = line.indexOf(" to ");
        let vstart = line.substring(vs, vt);

        let vend = line.substring(vt + 4);

        line =
            "for(" +
            vname +
            "=" +
            vstart +
            ";" +
            vname +
            "<=" +
            vend +
            ";" +
            vname +
            "++){";
    }
    if (first == "loop until") {
        line = line.replace("loop until", "while(!(") + ")){";
    }
    if (first == "loop") {
        let v = line.indexOf("loop") + 5;
        let ve = line.indexOf(" ", v);
        let vname = line.substring(v, ve);

        let vs = line.indexOf(" from ") + 6;
        let vt = line.indexOf(" to ");
        let vstart = line.substring(vs, vt);

        let vend = line.substring(vt + 4);

        line =
            "for(let " +
            vname +
            " = " +
            vstart +
            "; " +
            vname +
            " <= " +
            vend +
            "; " +
            vname +
            "++) {";
    }
    if (first == "end") {
        line = "}";
    }
    if (first == "output") {
        line = line.replace(/output /, "output(") + ")"
    }
    if (first == "input") {
        line = line.replace(/input /, "input('") + "')"
    }
    if (first == "method") {
        line = line.replace(/method/, "function") + "{";
    }

    if (first == "class") {
        line = line.replace(/Class/, "function") + "{";
    }

    return line;
}

function compile(code) {
    document.querySelector(".runner").innerHTML = ""

    let program = code.split("\n");

    for (line in program) {
        program[line] = translate(program[line])
    }

    return program.join("\n")
}
