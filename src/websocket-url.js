import { addTrailingSlash } from './trailing-slash.js';

/* The following fixes HenningM/express-ws#17, correctly. */
export function websocketUrl(url) {
  if (url.indexOf('?') !== -1) {
    const [baseUrl, query] = url.split('?');

    return `${addTrailingSlash(baseUrl)}.websocket?${query}`;
  }
  return `${addTrailingSlash(url)}.websocket`;
}
