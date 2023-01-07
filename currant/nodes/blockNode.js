
class CurrantBlockNode extends CurrantNode {

    constructor() {
        super("block");
        this.returnable = true;
        this.currant = null;
    }

    afterCopy() {
        this.variables = new Map(this.variables);
    }

    setRuntime(interpreter) {
        this.currant = interpreter;
        return this;
    }

    afterBlock() {
        if(this.block === null) return;
        this.setRuntime(this.block.currant);
    }

    setReturnable(returnable) {
        this.returnable = returnable;
        return this;
    }

    doParse() {
        if(this.tokens.length === 0) return;
        while(true) {
            if(super.token().name === "line_terminator") {
                if(!super.hasNextToken()) break;
                super.nextToken();
                continue;
            }
            super.addChild(super.evalUntil(null, true, false));
            if(!super.hasNextToken()) break;
            super.expectToken("line_terminator");
            super.nextToken();
        }
        super.expectEnd();
    }

    returnValue(value) {
        if(!this.returnable) {
            this.returnedValue = null;
            this.block.returnValue(value);
        } else {
            this.returnedValue = value;
        }
        this.executeChildren = false;
    }

    setAfterPrepare(action) {
        this.afterPrepare = action;
    }

    execute() {
        this.executeChildren = true;
        this.prepareExecute();
        this.childValues = new Array(this.children.length);
        for(let childIndex = 0; childIndex < this.children.length; childIndex++) {
            if(!this.executeChildren) break;
            this.childValues[childIndex] = this.children[childIndex].execute();
        }
        return this.doExecute();
    }

    prepareExecute() {
        this.returnedValue = null;
        this.variables = new Map();
        if(typeof this.afterPrepare !== "undefined") this.afterPrepare();
        this.afterPrepare = undefined;
    }

    doExecute() {
        if(this.returnedValue === null) return new CurrantNothingType().fromNode(null);
        return this.returnedValue;
    }

    static staticHasVariable(variables, parentBlock, name) {
        let parentHas = false;
        if(parentBlock !== null)
            parentHas = CurrantBlockNode.staticHasVariable(parentBlock.variables, parentBlock.block, name);
        return variables.has(name) || parentHas;
    }

    hasVariable(name) {
        return CurrantBlockNode.staticHasVariable(this.variables, this.block, name);
    }

    static staticGetVariable(variables, parentBlock, name) {
        if(!variables.has(name) && parentBlock !== null)
            return CurrantBlockNode.staticGetVariable(parentBlock.variables, parentBlock.block, name);
        if(!variables.has(name))
            throw new Error(`"${name}" is not a variable known by this scope`);
        return variables.get(name).get();
    }

    getVariable(name) {
        return CurrantBlockNode.staticGetVariable(this.variables, this.block, name);
    }

    static staticGetVariableRef(variables, parentBlock, name) {
        return new CurrantVariableReference((value) => {
            CurrantBlockNode.staticSetVariable(variables, parentBlock, name, value);
        }, () => {
            return CurrantBlockNode.staticGetVariable(variables, parentBlock, name);
        });
    }

    getVariableRef(name) {
        return CurrantBlockNode.staticGetVariableRef(this.variables, this.block, name);
    }

    static staticSetVariable(variables, parentBlock, name, value) {
        if(!CurrantBlockNode.staticHasVariable(variables, parentBlock, name) || variables.has(name)) { // does not exist in upper scope
            variables.set(name, new CurrantBlockVariableWrapperObject(value));
            return;
        }
        CurrantBlockNode.staticSetVariable(parentBlock.variables, parentBlock.block, name, value);
    }

    setVariable(name, value) {
        CurrantBlockNode.staticSetVariable(this.variables, this.block, name, value);
    }

    static staticCreateVariable(variables, parentBlock, name, value) {
        variables.set(name, new CurrantBlockVariableWrapperObject(value));
    }

    createVariable(name, value) {
        CurrantBlockNode.staticCreateVariable(this.variables, this.block, name, value);
    }

}

class CurrantBlockVariableWrapperObject {

    constructor(value) {
        this.value = value;
    }

    get() {
        return this.value;
    }

}