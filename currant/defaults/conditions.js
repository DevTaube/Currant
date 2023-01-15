
const CURRANT_STD_CONDITIONS = `
    if: fun = f@currantIf;
`;

function currantIf(condition, ifAction, elseAction) {
    if(typeof condition !== "boolean")
        throw new Error(`given argument at index 0 is not a boolean`);
    if(typeof ifAction !== "function")
        throw new Error(`given argument at index 1 is not a function`);
    if(typeof elseAction !== "undefined" && typeof elseAction !== "function")
        throw new Error(`given argument at index 2 is not a function / undefined`);
    if(condition === true) ifAction();
    if(condition === false && typeof elseAction === "function") elseAction();
}
