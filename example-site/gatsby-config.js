/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
  plugins: [
    // loads the source-plugin
    {
      resolve: `source-plugin`,
      options: {
        spaceId: "1234",
        preview: true,
      },
    },
    // required to generate optimized images
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
  ],
}
