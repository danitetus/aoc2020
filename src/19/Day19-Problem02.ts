import readLines from '../readLines'
import path from 'path'

const rules: Map<number, string> = new Map()
const computedRules: Map<string, string> = new Map()
const letter = /[ab]/
const pipe = /\|/

const messages: string[] = []
let maxLength: number = 0

const parseLine = (line: string): void => {
    if (/^\d+:/.test(line)) {
        // Its a rule
        const [index, rule] = line.split(':')
        rules.set(parseInt(index, 10), rule.trim())
    } else {
        // its content
        messages.push(line.trim())
        maxLength = line.trim().length > maxLength ? line.trim().length : maxLength
    }
}


const processRule = (value: string): string => {
    if (computedRules.has(value)) {
        const r = computedRules.get(value)
        if (r) {
            return r
        }
    }

    let computedResult: string = ''
    if (pipe.test(value)) {
        const items = value.split(' | ').map(i => i.trim())
        computedResult = `(${processRule(items[0])}|${processRule(items[1])})`
    } else if (letter.test(value)) {
        computedResult = value.replace(/"/gm, '')
    } else {
        const items = value.split(' ')
        computedResult = items.map((i) => {
            const val = rules.get(parseInt(i, 10)) || ''
            return processRule(val)
        }).join('')
    }
    computedRules.set(value, computedResult)
    return computedResult
}

const toRegex = (rules: string[]): string => {
    let exp = rules.join('|')
    return `(${exp})`
}

const main = async (): Promise<number> => {
    const lines = await readLines(path.join(__dirname, 'input.txt'))
    lines.forEach((line) => {
        parseLine(line)
    })

    // It is impossible to write a generic algorithm. So we have to analyze this case in particular
    // and to avoid infinite loops, we will use regular expressions. In this case, the rule 42 will appear more
    // times tha rule 31, so we will group each regular expressions and count how many times appear each one in
    // each message. When rule 42 appear more times that rule31, it will be valid.
    const content42 = rules.get(42) || ''
    const content31 = rules.get(31) || ''
    const exp42 = processRule(content42)
    const exp31 = processRule(content31)

    const finalExp = `^(?<g42>(${exp42}+))(?<g31>(${exp31}+))$`
    const exp = new RegExp(finalExp)
    let sum = 0
    for (const message of messages) {
        const matches = exp.exec(message)
        if (matches) {
            const {groups} = matches
            // How many times each group
            let m42: number
            let m31: number
            if (groups && groups.g42 && groups.g31) {
                // @ts-ignore
                const m42 = groups.g42.match(new RegExp(exp42, 'g')).length
                // @ts-ignore
                const m31 = groups.g31.match(new RegExp(exp31, 'g')).length
                if (m42 > m31) {
                    sum++
                }
            }
        }

    }
    return sum
}

export default main
