const decodeBase64 = (value) => {
  let bytes = ''
  let encodedIndex = 0
  let accumulator
  let alphabetIndex
  let chunkIndex = 0
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/='

  while ((alphabetIndex = value.charAt(chunkIndex++))) {
    alphabetIndex = alphabet.indexOf(alphabetIndex)
    if (~alphabetIndex) {
      accumulator = encodedIndex % 4 ? 64 * accumulator + alphabetIndex : alphabetIndex
      if (encodedIndex++ % 4) bytes += String.fromCharCode(255 & accumulator >> (-2 * encodedIndex & 6))
    }
  }

  return decodeURIComponent([...bytes].map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
}

const createDecoder = (values, offset) => {
  return (index) => decodeBase64(values[index - offset])
}

const mValues = [
  'C2v0rNjVBuf4AxnbBMDSzq','zgvNvg9sywq','nJbWrMzorwK','m0vMquzfvG','BwvZAa','y3vYCMvUDa','vgv4DhvYzuXVywrLCG','CgfYyw1LDgvYCW','C3fYDa','BxvSDgLWBhK','C2v0wfLA','yxr0CMLIDxrLCW','BgvUz3rO','yw5NBgu','BwvZAejHC2LJtwf0zxjPywW','ndy4mdLVu1fuyMO','CM90yxrPB24','BMvLzhnvCgrHDgu','ugXHBMvhzw9TzxrYEq','C3vIvMvJDg9YCW','y29WEq','uxvHDgvYBMLVBG','mZKXnty5mKLgDujvrW','y3jVC3m','CM90yxrLqxjVDw5K','z3jVDxa','z2v0wq','nJm4mZaWohz4qu5jsq','ndGWndfcvwrnz3y','ywjZ','z2v0rwXHChnLzfrPBwu','z2v0wa','rg91yMXLu2LKzq','twf0Afv0AwXZ','y291BNq','nJG4nZqWDLfPsNjM','mZy0otmWCeDZqwnP','CMfUzg9T','mJe3mNbPt01pwq','DhjHBNnSyxrL','C2LU','vMvJDg9YmW','C2v0rNjVBvvUAxrwzwn0B3jZ','Bg9Hza','zMXVB3i','nZbwvKPZyuS','BwfW','l2rHChbSzwqVBgvHDMvZl2XLywyUCg5N','mJu3n21XDKT5zW','rxvSzxi','vMvJDg9YmG'
]
const M = createDecoder(mValues, 339)
while (true) {
  try {
    const checksum = parseInt(M(369)) * (-parseInt(M(350)) / 2) + parseInt(M(363)) / 3 * (parseInt(M(353)) / 4) - parseInt(M(351)) / 5 - parseInt(M(368)) / 6 * (-parseInt(M(343)) / 7) + parseInt(M(342)) / 8 - parseInt(M(381)) / 9 * (-parseInt(M(360)) / 10) + parseInt(M(388)) / 11
    if (checksum === 619226) break
    mValues.push(mValues.shift())
  } catch {
    mValues.push(mValues.shift())
  }
}

const wValues = [
  'CM90yxrPB24','CMfUzg9T','C2v0rNjVBuf4AxnbBMDSzq','z2v0ug9PBNrbDa','C2LU','C2HHzg93twf0zxjPywW','odmWodqWB0PJwgz4','z2v0rwXHChnLzfrPBwu','mZbqsKTytg4','mti5mZe0n1DJCxHwtq','mtr5vuHdyuq','C2v0rNjVBvvUAxrwzwn0B3jZ','BxvSDgLWBhLty2fSyxi','zgvNvg9sywq','mJrLBgHJqMu','ndviAKnbrg0','mtiXnZq5mwz4AfvLCq','twf0Afv0AwXZ','BM9YBwfSAxPL','z2v0vgfUz2vUDef0','zM9YrwfJAa','BxvSDgLWBhK','z3jVDxa','y3vYCMvUDa','BwfW','nZa3ndmYCM1OzMHW','uxvHDgvYBMLVBG','ywrK','q2f0BxvSBfjVBun1CNzLmW','mtyYnZqXnKDTALfSua','C3vI','ChvZAa','vMvJDg9YmW','yxbWBhLrDwf0zxjUAw9U','y2XVBMu','mJq5mZbgy0T5DMi','mtyWnJC1ofHxq3njCq','Cg93','BwvZAa'
]
const W = createDecoder(wValues, 272)
while (true) {
  try {
    const checksum = -parseInt(W(307)) * (-parseInt(W(288)) / 2) - parseInt(W(289)) / 3 + parseInt(W(282)) / 4 + parseInt(W(298)) / 5 * (parseInt(W(306)) / 6) - parseInt(W(302)) / 7 * (parseInt(W(278)) / 8) - parseInt(W(301)) / 9 + parseInt(W(300)) / 10 * (-parseInt(W(308)) / 11)
    if (checksum === 444281) break
    wValues.push(wValues.shift())
  } catch {
    wValues.push(wValues.shift())
  }
}

console.log('M', Object.fromEntries(Array.from({ length: 51 }, (_, index) => [index + 339, M(index + 339)])))
console.log('W', Object.fromEntries(Array.from({ length: 39 }, (_, index) => [index + 272, W(index + 272)])))
