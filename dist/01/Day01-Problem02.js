"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const findSumNumbers = (inputNumbers) => {
    for (let i = 0; i < inputNumbers.length; i++) {
        const firstSum = parseInt(inputNumbers[i].toString(), 10);
        for (let j = i; j < inputNumbers.length; j++) {
            const secondSum = parseInt(inputNumbers[j].toString(), 10);
            for (let k = j; k < inputNumbers.length; k++) {
                const thirdSum = parseInt(inputNumbers[k].toString(), 10);
                if (firstSum + secondSum + thirdSum === 2020) {
                    return [firstSum, secondSum, thirdSum];
                }
            }
        }
    }
    throw new Error('Sum not found');
};
const start = async () => {
    const inputData = await fs_1.default.promises.readFile(path_1.default.join(__dirname, 'input.txt'));
    const numbers = inputData.toString().split('\n').map((line) => {
        return parseInt(line.trim(), 10);
    });
    const sumNumbers = findSumNumbers(numbers);
    const result = sumNumbers[0] * sumNumbers[1] * sumNumbers[2];
    return result;
};
exports.default = start;
