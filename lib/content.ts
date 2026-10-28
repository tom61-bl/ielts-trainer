/** Content-addressed sample paths: /samples/<paperId>/<md5>.<ext>?v=<n> */
export function versionedPath(
  paperId: string,
  hash: string,
  ext: string,
  version: number,
) {
  return `/samples/${paperId}/${hash}.${ext}?v=${version}`;
}

export function isContentAddressed(url: string) {
  return /\/samples\/[^/]+\/[a-f0-9]{32}\.(pdf|mp3)(\?v=\d+)?$/.test(url);
}
