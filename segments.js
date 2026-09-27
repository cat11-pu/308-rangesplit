// segments.js：分段表的操作
export function splitSegment(segments, start) {
  const index = segments.findIndex(function (seg) { return seg[0] === start; });
  if (index === -1) {
    const error = new Error("no segment starts at " + start);
    error.code = "E_NO_RANGE";
    throw error;
  }
  const seg = segments[index];
  const length = seg[1] - seg[0];
  if (length < 2) {
    const error = new Error("segment too small to split");
    error.code = "E_TOO_SMALL";
    throw error;
  }
  const mid = seg[0] + Math.floor(length / 2);
  return segments.slice(0, index)
    .concat([[seg[0], mid], [mid, seg[1]]], segments.slice(index + 1));
}

export function locateSegment(segments, key) {
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index][0] <= key && key < segments[index][1]) return index;
  }
  return -1;
}
