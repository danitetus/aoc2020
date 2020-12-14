"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readLines_1 = __importDefault(require("../readLines"));
const path_1 = __importDefault(require("path"));
const applyMask = (num, mask) => {
    let numBitsReverse = num.toString(2).split('').reverse();
    const maskReverse = mask.split('').reverse();
    const result = maskReverse.map((num, index) => {
        if (num !== 'X') {
            return num;
        }
        if (numBitsReverse[index]) {
            return numBitsReverse[index];
        }
        return '0';
    });
    return parseInt(result.reverse().join(''), 2);
};
const applyMemoryMask = (num, mask) => {
    let numBitsReverse = num.toString(2).split('').reverse();
    const maskReverse = mask.split('').reverse();
    const result = maskReverse.map((num, index) => {
        if (num === 'X') {
            return 'X';
        }
        if (num === '1') {
            return '1';
        }
        if (numBitsReverse[index]) {
            return numBitsReverse[index];
        }
        return '0';
    });
    const addresses = [];
    const xs = result.filter((item) => item === 'X').length;
    const combinations = 2 ** xs;
    for (let i = 0; i < combinations; i++) {
        const ibin = i.toString(2).split('').reverse();
        const memAdd = result.map((value, index) => {
            if (value === 'X') {
                if (ibin.length > 0) {
                    return ibin.splice(0, 1)[0];
                }
                return '0';
            }
            return value;
        });
        addresses.push(parseInt(memAdd.reverse().join(''), 2));
    }
    return addresses;
};
const main = async () => {
    const lines = await readLines_1.default(path_1.default.join(__dirname, 'input.txt'));
    let memory = {};
    let maskPattern = '';
    lines.forEach((line) => {
        const isMask = line.match(/^mask = ([X10]{36})/);
        if (isMask) {
            maskPattern = isMask[1];
        }
        const isInstruction = line.match(/^mem\[(\d+)] = (\d+)/);
        if (isInstruction) {
            const memoryAddress = parseInt(isInstruction[1], 10);
            const memories = applyMemoryMask(memoryAddress, maskPattern);
            for (let add of memories) {
                memory[add] = parseInt(isInstruction[2], 10);
            }
        }
    });
    let result = 0;
    for (let index in memory) {
        result += memory[index];
    }
    return result;
};
exports.default = main;
