import readLines from '../readLines'
import path from 'path'
import has = Reflect.has

type IEdge = {
    id: number;
    rotated: number;
    flipV: boolean;
    flipH: boolean;
}

type ITileNeighbour = {
    id: number;
    rotated: number;
    flipV: boolean;
    flipH: boolean;
}
const TILES: Map<number, string[][]> = new Map()
const EDGES: Map<string, IEdge[]> = new Map()
const NEIGHBOURS: Map<number, ITileNeighbour[]> = new Map()
let SQUARE_LENGTH: number = 0

const flipVertically = (content: string[][]): string[][] => {
    return content.reverse()
}

const flipHorizontally = (content: string[][]): string[][] => {
    return content.map((line) => {
        return line.reverse()
    })
}

const rotateBy90 = (m: string[][]): string[][] => {
    const length = m.length;
    //for each layer of the matrix
    for (let first = 0; first < length >> 1; first++) {
        let last = length - 1 - first;
        for (let i = first; i < last; i++) {
            let top = m[first][i]; //store top
            m[first][i] = m[last - i][first]; //top = left
            m[last - i][first] = m[last][last - i]; //left = bottom
            m[last][last - i] = m[i][last]; //bottom = right
            m[i][last] = top; //right = top
        }
    }
    return m;
}

const rotate = (direction: number, times: number, content: string[][]): string[][] => {
    // direction == 1 clockwise
    // direction == -1 reverse clockwise
    times = times % 4
    if (times === 0) {
        return content
    } if (times === 3 && direction === -1) {
        // Rotate one time to the other direction
        return rotate(1, 1, content)
    } else if (times === 2) {
        // flip vertically and horizontally
        const flipV = flipVertically(content)
        return flipHorizontally(flipV)
    } else {
        // Rotating clockwise n times
        let result: string[][] = content
        for (let i = 0; i < times; i++) {
            result = rotateBy90(result)
        }
        return result
    }
}

const saveEdge = (content: string, id: number, rotated: number, flipV: boolean, flipH: boolean) => {
    if (!EDGES.has(content)) {
        EDGES.set(content, [{
            id,
            rotated,
            flipV,
            flipH
        }])
    } else {
        const edge = EDGES.get(content)
        if (edge) {
            // avoid duplicated ids
            for (let i = 0; i < edge.length; i++) {
                if (edge[i].id === id) {
                    return
                }
            }
            edge.push({
                id,
                rotated,
                flipV: flipV,
                flipH: flipH
            })
            EDGES.set(content, edge)
        }
    }
}

const storeEdges = (id: number, tile: string[][]) => {
    let content: string
    // Normal edge
    content = tile[0].join('')
    saveEdge(content, id, 0, false, false)

    // Rotate 90
    content = rotate(1, 1, tile)[0].join('')
    saveEdge(content, id, 1, false, false)

    // Rotate 180
    content = rotate(1, 2, tile)[0].join('')
    saveEdge(content, id, 1, false, false)

    // Rotate 270
    content = rotate(1, 3, tile)[0].join('')
    saveEdge(content, id, 1, false, false)

    // flippedH
    const flippedH = flipHorizontally(tile)
    saveEdge(flippedH[0].join(''), id, 0, false, true)

    // FlippedH rotate 90
    content = rotate(1, 1, flippedH)[0].join('')
    saveEdge(content, id, 1, false, true)

    // FlippedH rotate 180
    content = rotate(1, 2, flippedH)[0].join('')
    saveEdge(content, id, 2, false, true)

    // FlippedH rotate 270
    content = rotate(1, 3, flippedH)[0].join('')
    saveEdge(content, id, 3, false, true)


    // flippedV
    const flippedV = flipVertically(tile)
    saveEdge(flippedV[0].join(''), id, 0, true, false)

    // FlippedH rotate 90
    content = rotate(1, 1, flippedV)[0].join('')
    saveEdge(content, id, 1, true, false)

    // FlippedH rotate 180
    content = rotate(1, 2, flippedV)[0].join('')
    saveEdge(content, id, 2, true, false)

    // FlippedH rotate 270
    content = rotate(1, 3, flippedV)[0].join('')
    saveEdge(content, id, 3, true, false)
}

const saveNeighbour = (id: number, edges: IEdge[]) => {
    if (NEIGHBOURS.has(id)) {
        const data = NEIGHBOURS.get(id)
        if (data) {
            for (let i = 0; i < edges.length; i++) {
                let found = false
                for (let j = 0; j < data.length; j++) {
                    if (data[j].id === edges[i].id) {
                        found = true
                    }
                }
                if (!found) {
                    data.push(edges[i])
                }
            }
            NEIGHBOURS.set(id, data)
        }
    } else {
        NEIGHBOURS.set(id, edges)
    }
}
const calculateNeighbours = () => {
    Array.from(EDGES.entries()).forEach((edge) => {
        for (let i = 0; i < edge[1].length; i++) {
            const current = edge[1][i]
            const rest = edge[1].filter((e, idx) => idx !== i)
            saveNeighbour(current.id, rest)
        }
    })
}

type ICandidates = {
    [id: number]: {
        tile: ITileNeighbour,
        quantity: number
    }
}
const getByNeighbours = (maxNeighbours: number, hasNeighbours: ITileNeighbour[], ignoreTiles?: ITileNeighbour[]): ITileNeighbour => {
    if (!Array.isArray(ignoreTiles)) {
        ignoreTiles = []
    }
    // console.log(`Looking for tiles that have ${maxNeighbours} neighbours and his neighbours are ${hasNeighbours.map(n=>n.id)}, ignoring ${ignoreTiles.map((i) => i.id).join(',')}`)
    let candidates: ICandidates = {}
    candidates = hasNeighbours.reduce((accum: ICandidates, tile) => {
        const neighbours = NEIGHBOURS.get(tile.id)
        if (neighbours) {
            for (let i = 0; i < neighbours.length; i++) {
                const n = neighbours[i]
                // Get number of neighbours
                const childNeighbours = NEIGHBOURS.get(n.id)
                if (childNeighbours && childNeighbours.length === maxNeighbours) {
                    if (typeof accum[n.id] === 'undefined') {
                        accum[n.id] = {
                            tile: n,
                            quantity: 1
                        }
                    } else {
                        accum[n.id].quantity += 1
                    }
                }
            }
        }
        return accum
    }, {})
    const cnd: ITileNeighbour[] = Array.from(Object.entries(candidates)).map((tile) => {
        const id = tile[1].tile.id
        // @ts-ignore
        for (let i = 0; i < ignoreTiles.length; i++) {
            // @ts-ignore
            if (ignoreTiles[i].id === id) {
                tile[1].quantity = 0
            }
        }
        return tile
    }).sort((a, b) => {
        if (a[1].quantity > b[1].quantity) {
            return -1
        } else if (a[1].quantity < b[1].quantity) {
            return 1
        }
        return 0
    }).map((t) => t[1].tile)
    // console.log(`    - Found ${cnd.map(c => c.id).join(',')}`)
    return cnd[0]

}

const arrangeAll = (): ITileNeighbour[][] => {
    // Get one square
    const squares: number[] = Array.from(NEIGHBOURS.entries()).filter((item) => {
        return item[1].length === 2
    }).map((item) => item[0])

    // get one square

    let topLeft: ITileNeighbour | null = null
    Array.from(NEIGHBOURS.values()).forEach((tile) => {
        for (const n of tile) {
            if (n.id === squares[0]) {
                topLeft = n
            }
        }
    })

    const choosen: ITileNeighbour[] = []
    const matrix: ITileNeighbour[][] = []

    for (let r = 0; r < SQUARE_LENGTH; r++) {
        matrix[r] = Array(SQUARE_LENGTH)
        for (let c = 0; c < SQUARE_LENGTH; c++) {
            if (r === 0 && c === 0) {
                //console.log(`Top left corner`)
                // top left corner
                if (topLeft) {
                    matrix[r][c] = topLeft
                }
            } else if (r === 0 && c === SQUARE_LENGTH - 1) {
                //console.log(`Top right corner`)
                // Top right corner, find tile that is corner and neighbour from matrix[r][c-1]
                matrix[r][c] = getByNeighbours(2, [matrix[r][c-1]], choosen)
            } else if (r === SQUARE_LENGTH - 1 && c === 0) {
                //console.log(`Bottom left corner`)
                // Bottom left corner, find tile that is corner and neighbour from matrix[r-1][0]
                matrix[r][c] = getByNeighbours(2, [matrix[r-1][0]], choosen)
            } else if (r === SQUARE_LENGTH - 1 && c === SQUARE_LENGTH - 1) {
                //console.log(`Bottom right corner`)
                // Bottom right corner. Find tile that is corner and neighbour from matrix[r][c-1]
                matrix[r][c] = getByNeighbours(2, [matrix[r-1][c],matrix[r][c-1]], choosen)
            } else if (c === 0) {
                //console.log(`Left wall ${r},${c}`)
                // Left wall. Find tile neighbour from matrix[r-1][0] and have 3 neighbours
                matrix[r][c] = getByNeighbours(3, [matrix[r-1][c]], choosen)
            } else if (c === SQUARE_LENGTH - 1) {
                //console.log(`Right wall ${r},${c}`)
                // Right wall. Find tile neighbour from matrix[r-1][c] and have 3 neighbours
                matrix[r][c] = getByNeighbours(3, [matrix[r-1][c],matrix[r][c-1]], choosen)
            } else if (r === 0) {
                // Top. Find tile the is neighbour from matrix[r][c-1] and have 3 neighbours
                //console.log(`Top ${r},${c}`)
                matrix[r][c] = getByNeighbours(3, [matrix[r][c-1]], choosen)
            } else if (r === SQUARE_LENGTH - 1) {
                //console.log(`Bottom ${r},${c}`)
                // Bottom row. Find tile that is neighbour from matrix[r][c-1] and matrix[r-1][c]
                matrix[r][c] = getByNeighbours(3, [matrix[r][c-1],matrix[r-1][c]], choosen)
            } else {
                //console.log(`Middle zone ${r},${c}`)
                // Middle zone. Find tile that is neighbour from matrix[r][c-1] and matrix[r-1][c]
                matrix[r][c] = getByNeighbours(4, [matrix[r][c-1],matrix[r-1][c]], choosen)
            }
            choosen.push(matrix[r][c])
        }
    }

    return matrix
}
const getRightBorder = (content: string[][]): string => {
    return content.reduce((accum: string, row) => {
        accum += row[row.length - 1]
        return accum
    }, '')
}

const getLeftBorder = (content: string[][]): string => {
    return content.reduce((accum: string, row) => {
        accum += row[0]
        return accum
    }, '')
}
const fixRotation = (reference: string[][], content: string[][], first?: boolean): string[][][] => {
    const refP = reference
    const conP = content
    if (first) {
        // We have to rotate 0x0 (reference) to be aligned with 0x1 (source)
        let right = getRightBorder(reference)
        let left = getLeftBorder(content)
        for (let r1 = 0; r1 < 2; r1++) {
            for (let r2 = 0; r2 < 2; r2++) {
                for (let i = 0; i < 4; i++) {
                    let right = getRightBorder(reference)
                    for (let j = 0; j < 4; j++) {
                        let left = getLeftBorder(content)
                        if (right === left) {
                            return [reference, content]
                        }
                        content = rotate(1, 1, content)
                    }
                    reference = rotate(1, 1, reference)
                }
                content = flipVertically(content)
            }
            reference = flipVertically(reference)
        }
    } else {
        // We have to rotate content to be
        const right = getRightBorder(reference)
        for (let r = 0; r < 2; r++) {
            for (let i = 0; i < 4; i++) {
                const left = getLeftBorder(content)
                if (right === left) {
                    return [reference, content]
                }
                rotate(1, 1, content)
            }
            content = flipVertically(content)
        }
    }
    return [refP, conP]
}

const renderImage = (source: ITileNeighbour[][]) => {
    const matrix: string[] = []

    for (let r = 0; r < source.length; r++) {
        const accum: string[][][] = []
        const row = source[r]
        for (let c = 0; c < row.length; c++) {
            const tile = row[c]
            // getting tile content
            let content = TILES.get(row[c].id) || []
            console.log(`${r},${c}`)
            if (tile.flipH) {
                console.log(`   - Flip horizontally`)
                content = flipHorizontally(content)
            } else if (tile.flipV) {
                console.log(`   - Flip vertically`)
                content = flipHorizontally(content)
            }
            if (c === 0) {
                let next = TILES.get(row[c+1].id) || []
                const nextTile = row[c+1]
                if (nextTile.flipV) {
                    console.log(`   - Flip vertically`)
                    next = flipVertically(next)
                } else if (nextTile.flipH) {
                    console.log(`   - Flip horizontally`)
                    next = flipHorizontally(next)
                }
                let res = fixRotation(content, next, true)
                content = res[0]
                TILES.set(row[c].id, content)
                TILES.set(row[c + 1].id, res[1])
            } else {
                const before = TILES.get(row[c - 1].id) || []
                let res = fixRotation(before, content, false)
                content = res[1]
                TILES.set(row[c].id, res[1])
            }
            let newTile = true
            accum.push(content)
        }
        console.log(`${accum.length} tiles in this row`)
        for (let r = 0; r < 10; r++) {
            const line = accum.reduce((ac: string, content) => {
                ac += content[r].join('') + '  '
                return ac
            }, '')
            matrix.push(line)
        }
        matrix.push(Array(30).fill(' ').join(''))
    }
    console.log(matrix)
}

const main = async(): Promise<number> => {
    const lines = await readLines(path.join(__dirname, 'sample.txt'))

    let lastId: number = -1
    let actualContent: string[][] = []
    for (let line of lines) {
        if (/^Tile/.test(line)) {
            if (actualContent.length > 0) {
                TILES.set(lastId, actualContent)
            }
            const id = line.split(' ')[1].replace(':', '')
            lastId = parseInt(id, 10)
            actualContent = []
        } else {
            actualContent.push(line.split(''))
        }
    }
    TILES.set(lastId, actualContent)

    Array.from(TILES.entries()).forEach((tile) => {
        storeEdges(tile[0], tile[1])
    })

    calculateNeighbours()

    SQUARE_LENGTH = Math.sqrt(TILES.size)
    const mat = arrangeAll()

    const repeated: number[] = []
    const used: number[] = []
    mat.forEach((row) => {
        console.log(row.map((r) => r.id).join(' '))

        for (const tile of row) {
            if (used.indexOf(tile.id) >= 0) {
                repeated.push(tile.id)
            } else {
                used.push(tile.id)
            }
        }
    })
    console.log(`Repeated: ${repeated.join(',')}`)
    renderImage(mat)
    return -1
}

main().then((result) => {
    console.log(`Result: ${result}`)
}).catch(console.error)
