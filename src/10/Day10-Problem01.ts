import readLines from '../readLines'
import path from 'path'

type Differences = {
    1: number;
    2: number;
    3: number;
}

const differences: Differences = {
    1: 0,
    2: 0,
    3: 1
}

const processLine = (previous: number, line: number): number => {
    const diff = line - previous
    if (diff > 3) {
        return -1
    }
    switch (diff) {
        case 1:
            differences[1] += 1
            break
        case 2:
            differences[2] += 1
            break
        case 3:
            differences[3] += 1
            break
    }
    return line
}

const start = async (): Promise<number> => {
    const lines = await readLines(path.join(__dirname, 'input.txt'))

    const linesNumber = lines.map((line) => parseInt(line, 10))
    linesNumber.sort((a, b) => {
        if (a > b) {
            return 1
        } else if (a < b) {
            return -1
        }
        return 0
    })

    let result: number = -1
    let previous: number = 0
    for (let i = 0; i < linesNumber.length; i++) {
        const line = linesNumber[i]
        if (processLine(previous, line) < 0) {
            result = differences[1] * differences[3]
            console.log(differences)
            return result
        }
        previous = line
    }
    return differences[1] * differences[3]
}

export default start
