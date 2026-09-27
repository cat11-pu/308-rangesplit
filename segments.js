// segments.js：分段表的操作
function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

export function splitSegment(segments, start) {
  const index = segments.findIndex(function (seg) { return seg[0] === start; });
  if (index === -1) fail("E_NO_RANGE");
  const seg = segments[index];
  const width = seg[1] - seg[0];
  if (width < 2) fail("E_TOO_SMALL");
  const mid = seg[0] + Math.floor(width / 2);
  return segments.slice(0, index)
    .concat([[seg[0], mid], [mid, seg[1]]])
    .concat(segments.slice(index + 1));
}

export function locateSegment(segments, key) {
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index][0] <= key && key < segments[index][1]) return index;
  }
  return -1;
}
