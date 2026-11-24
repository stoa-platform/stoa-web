import { handleShortLinkStats } from '../lib/short-links-redirect.js';

export default function handler(req, res) {
  return handleShortLinkStats(req, res);
}
