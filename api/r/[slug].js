import { handleShortLinkRedirect } from '../../lib/short-links-redirect.js';

export default function handler(req, res) {
  return handleShortLinkRedirect(req, res);
}
