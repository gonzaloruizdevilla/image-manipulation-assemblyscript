/// <reference path="../node_modules/assemblyscript/dist/assemblyscript.d.ts" />

export function invert(byteSize: i32): i32 {
  for (let i = 0; i < byteSize; i += 4) {
    let pos = i + byteSize;
    store<u8>(pos + 0, 255 - load<u8>(i + 0));
    store<u8>(pos + 1, 255 - load<u8>(i + 1));
    store<u8>(pos + 2, 255 - load<u8>(i + 2));
    store<u8>(pos + 3, 255);
  }
  return 0;
}


export function grayscale(byteSize: i32): i32 {
  for (let i = 0; i < byteSize; i += 4) {
    let pos = i+byteSize;
    const avg = u8(0.3 * load<u8>(i) + 0.59 * load<u8>(i + 1) + 0.11 * load<u8>(i + 2));
    store<u8>(pos + 0, avg);
    store<u8>(pos + 1, avg);
    store<u8>(pos + 2, avg);
    store<u8>(pos + 3, 255);
  }
  return 0;
}

export function sepia(byteSize: i32): i32 {
  for (let i = 0; i < byteSize; i += 4) {
    let pos = i + byteSize;
    const avg = 0.3 * load<u8>(i) + 0.59 * load<u8>(i + 1) + 0.11 * load<u8>(i + 2);
    store<u8>(pos + 0, u8(min(avg + 100, 255)));
    store<u8>(pos + 1, u8(min(avg + 50, 255)));
    store<u8>(pos + 2, u8(avg));
    store<u8>(pos + 3, 255);
  }
  return 0;
}

@inline
function addConvolveValue(pos:i32, oldValue:u8, length:i32): i32 {
  return i32(pos >= 0) & i32(pos < length) ? load<u8>(pos) : oldValue;
}

export function convolve(
  byteSize:i32,
  w:i32,
  offset:i32,
  v00:i32, v01:i32, v02:i32,
  v10:i32, v11:i32, v12:i32,
  v20:i32, v21:i32, v22:i32
): i32 {
  let divisor = (v00 + v01 + v02 + v10 + v11 + v12 + v20 + v21 + v22) || 1;
  for (let i = 0; i < byteSize; i++){
    if (((i + 1) & 3) == 0) {
      store<u8>(i + byteSize, load<u8>(i));
      continue;
    }
    let stride = w * 4;
    let prev = i - stride;
    let next = i + stride;
    let oldValue = load<u8>(i);
    let res =
      v00 * addConvolveValue(prev - 4, oldValue, byteSize) +
      v01 * addConvolveValue(prev,     oldValue, byteSize) +
      v02 * addConvolveValue(prev + 4, oldValue, byteSize) +
      v10 * addConvolveValue(i - 4,    oldValue, byteSize) +
      v11 * oldValue +
      v12 * addConvolveValue(i + 4,    oldValue, byteSize) +
      v20 * addConvolveValue(next - 4, oldValue, byteSize) +
      v21 * addConvolveValue(next,     oldValue, byteSize) +
      v22 * addConvolveValue(next + 4, oldValue, byteSize);
    res /= divisor;
    res += offset;
    store<u8>(i + byteSize, u8(res));
  }
  return 0;
}
