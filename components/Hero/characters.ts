// ref characters from https://raw.githubusercontent.com/oddoid/mem/HEAD/dist/mem-prop-5x6-10x-sheet.png

// prettier-ignore
const CHARACTER = {
  " ": [
    0, 0, 0, 
    0, 0, 0, 
    0, 0, 0, 
    0, 0, 0, 
    0, 0, 0, 
  ],
  A: [
    1, 1, 1, 
    1, 0, 1, 
    1, 1, 1, 
    1, 0, 1, 
    1, 0, 1, 
  ],
  B: [
    1, 1, 0, 
    1, 0, 1, 
    1, 1, 0, 
    1, 0, 1, 
    1, 1, 0, 
  ],
  C: [
    1, 1, 1, 
    1, 0, 0, 
    1, 0, 0, 
    1, 0, 0, 
    1, 1, 1, 
  ],
  D: [
    1, 1, 0, 
    1, 0, 1, 
    1, 0, 1, 
    1, 0, 1, 
    1, 1, 0, 
  ],
  E: [
    1, 1, 1, 
    1, 0, 0, 
    1, 1, 0, 
    1, 0, 0, 
    1, 1, 1, 
  ],
  // TODO: F
  G: [
    1, 1, 1, 
    1, 0, 0, 
    1, 0, 1, 
    1, 0, 1, 
    1, 1, 1, 
  ],
  // TODO: H
  // TODO: I
  // TODO: J
  // TODO: K
  L: [
    1, 0, 0, 
    1, 0, 0, 
    1, 0, 0, 
    1, 0, 0, 
    1, 1, 1, 
  ],
  M: [
    1, 1, 1, 1, 1,
    1, 0, 1, 0, 1,
    1, 0, 1, 0, 1,
    1, 0, 1, 0, 1,
    1, 0, 0, 0, 1,
  ],
  // TODO: N
  O: [
    1, 1, 1, 
    1, 0, 1, 
    1, 0, 1, 
    1, 0, 1, 
    1, 1, 1, 
  ],
  P: [
    1, 1, 1, 
    1, 0, 1, 
    1, 1, 1, 
    1, 0, 0, 
    1, 0, 0, 
  ],
  // TODO: Q
  R: [
    1, 1, 1, 
    1, 0, 1, 
    1, 1, 0, 
    1, 0, 1, 
    1, 0, 1, 
  ],
  // TODO: S
   T: [
    1, 1, 1, 
    0, 1, 0, 
    0, 1, 0, 
    0, 1, 0, 
    0, 1, 0, 
  ],
  U: [
    1, 0, 1, 
    1, 0, 1, 
    1, 0, 1, 
    1, 0, 1, 
    1, 1, 1, 
  ],
  V: [
    1, 0, 1, 
    1, 0, 1, 
    1, 0, 1, 
    1, 1, 1, 
    0, 1, 0, 
  ]
  // TODO: W
  // TODO: X
  // TODO: Y
  // TODO: Z
}

export const getCharacters = (str: string) =>
  str
    .toUpperCase()
    .split("")
    .map((key) => {
      const char = CHARACTER[key as keyof typeof CHARACTER]

      if (!char) {
        console.error(
          `getCharacters, character "${key}" not supported. Add it to CHARACTER.`
        )
        return
      }

      return char
    })
    .filter(Boolean) as number[][]
