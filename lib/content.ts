/** Prefix root-absolute public files when the site lives under a subpath, such as GitHub Pages. */
export function publicPath(url: string) {
  if (!url || /^(https?:|blob:|data:)/.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base || url === base || url.startsWith(`${base}/`)) return url;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

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
