export default function (eleventyConfig) {
  // Media keeps its exact live-site URLs (/files/..., /uploads/...) — SEO requirement.
  eleventyConfig.addPassthroughCopy('files');
  eleventyConfig.addPassthroughCopy('uploads');
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/_redirects': '_redirects' });
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': 'robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'rescue/favicon.ico': 'favicon.ico' });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    // Page bodies are raw HTML extracted verbatim from the live site; they must
    // not be run through a template engine (fidelity requirement).
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
