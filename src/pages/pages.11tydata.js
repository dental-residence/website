export default {
  eleventyComputed: {
    // URLs must match the live Weebly site exactly (SEO): /<name>.html at root.
    // page.fileSlug resolves "index" to the parent dir name, so use the
    // input path's basename instead.
    permalink: data => '/' + data.page.inputPath.split('/').pop(),
  },
};
