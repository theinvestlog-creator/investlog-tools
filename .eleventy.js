export default function(eleventyConfig) {
  // Pass-through static assets and data (keeps URLs the same)
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "data": "data" });
  eleventyConfig.addPassthroughCopy({ "favicon.ico": "favicon.ico" });
  return {
    dir: { input: "src", includes: "_includes", output: "_site" }
  };
}
