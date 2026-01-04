export function wpPostDefaults(overrides: Partial<any>) {
  const now = new Date();

  return {
    post_date: now,
    post_date_gmt: now,
    post_modified: now,
    post_modified_gmt: now,

    post_excerpt: '',
    post_content_filtered: '',
    to_ping: '',
    pinged: '',
    guid: '',

    comment_status: 'closed',
    ping_status: 'closed',
    post_password: '',

    post_parent: 0,
    menu_order: 0,
    post_mime_type: '',
    comment_count: 0,

    ...overrides,
  };
}
