
// the currant interpreter
class Currant {

    constructor() {
        this.preprocessor = new CurrantPreprocessor();
        this.lexer = new CurrantLexer();
        this.lastBlockNode = null;
        this.currentFile = null;
        this.currentLine = 0;
        this.scriptTagName = "currant-script";
        this.showInterpreterStackTrace = false;
        this.printPreprocessorOutput = false;
        this.stack = new CurrantStack();
        this.loader = new CurrantScriptLoader();
        this._loadDefaults();
    }

    _loadDefaults() {
        this.run(CURRANT_STD_TYPES, "std.types.crn");
        this.run(CURRANT_STD_CONSOLE, "std.console.crn");
        this.run(CURRANT_STD_CONDITIONS, "std.conditions.crn");
        this.run(CURRANT_STD_MATH, "std.math.crn");
        this.run(CURRANT_STD_LOOPS, "std.loops.crn");
        this.run(CURRANT_STD_BOXES, "std.boxes.crn");
        this.run(CURRANT_STD_STRINGS, "std.strings.crn");
        this.run(CURRANT_STD_TIME, "std.time.crn");
        this.run(CURRANT_STD_ARRAYS, "std.arrays.crn");
        this.run(CURRANT_STD_DATASTRUCTURES, "std.data_structures.crn");
        this.run(CURRANT_STD_TESTING, "std.testing.crn");
        this.run(CURRANT_STD_MACROS, "std.macros.crn");
    }

    showInternalStackTrace(show) {
        this.showInterpreterStackTrace = show === true;
    }

    showPreprocessorOutput(show) {
        this.printPreprocessorOutput = show === true;
    }

    handleError(error) {
        if(!this.showInterpreterStackTrace)
            throw new Error(this.stack.produceStackTrace(this.currentFile, this.currentLine, error.message));
        else {
            console.error(this.stack.produceStackTrace(this.currentFile, this.currentLine, error.message));
            throw error;
        }
    }

    _runInternal(scriptText, fileName) {
        this.stack.clear();
        if(typeof fileName === "undefined") fileName = null;
        // preprocessor
        let processedText = this.preprocessor.process(scriptText);
        if(this.printPreprocessorOutput === true) {
            console.info("Processing of Macros for script \"" + fileName + "\" produced the following output:");
            console.info(processedText);
        }
        // lexer
        let tokens = this.lexer.tokenize(processedText, fileName);
        for(const token of tokens) token.currant = this; // attach runtime reference to tokens (for errors during parsing)
        // parsing
        let blockNode = new CurrantBlockNode().setRuntime(this).parse(tokens);
        blockNode.block = this.lastBlockNode;
        // execution
        let executeResult = blockNode.execute();
        this.lastBlockNode = blockNode;
        if(executeResult === null) return executeResult;
        else return executeResult.getValue();
    }

    run(scriptText, fileName) {
        try {
            return this._runInternal(scriptText, fileName);
        } catch(error) {
            this.handleError(error);
        }
    }

    test(scriptText, fileName) {
        let returnedValue;
        try {
            returnedValue = this._runInternal(scriptText, fileName);
        } catch(error) {
            console.error(`Test "${fileName}" failed:`);
            this.handleError(error);
            return;
        }
        console.log(
            "%c" + `Test "${fileName}" passed!`,
            "color: #84da72;"
        );
        return returnedValue;
    }

}
const currant = new Currant();