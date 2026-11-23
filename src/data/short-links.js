// Per-channel short links: every /r/<slug> page redirects to the same target.
export const SHORT_LINK_TARGET = 'https://github.com/stoa-platform/stoa';

const POST_COMMENT_BIO = ['post', 'comment', 'bio'];
const POST_COMMENT = ['post', 'comment'];

// Channel -> the link types published for it. A slug is `<channel>-<type>`.
export const SHORT_LINK_CHANNELS = {
  x: POST_COMMENT_BIO,
  linkedin: POST_COMMENT_BIO,
  hn: POST_COMMENT_BIO,
  devto: POST_COMMENT_BIO,
  'github-discussions': POST_COMMENT_BIO,
  reddit: POST_COMMENT,
  'reddit-mcp': POST_COMMENT,
  'reddit-claudeai': POST_COMMENT,
  'reddit-selfhosted': POST_COMMENT,
  github: ['bio'],
};

export const SHORT_LINK_SLUGS = Object.entries(SHORT_LINK_CHANNELS)
  .flatMap(([channel, types]) => types.map(type => `${channel}-${type}`));

export const shortLinkPath = slug => `/r/${slug}`;
