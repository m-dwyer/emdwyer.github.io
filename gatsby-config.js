/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
  /* Your site config here */
  plugins: [],
}
module.exports = {
  siteMetadata: {
    title: "mdwyer.io",
    description: "mdwyer's personal site",
    contact: {
      github: "https://github.com/m-dwyer",
      strava: "https://www.strava.com/athletes/thatmd",
    },
  },
  plugins: [
    "gatsby-plugin-emotion",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "blog",
        path: `${__dirname}/content/blog`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 600,
            },
          },
        ],
      },
    },
    "gatsby-transformer-sharp",
    "gatsby-plugin-sharp",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "mdwyerio",
        short_name: "mdwyerio",
        start_url: "/",
        background_color: "#323232",
        theme_color: "#cb4ec7",
        display: "standalone",
        icon: "src/images/icon.png",
      },
    },
    "gatsby-awesome-pagination",
    {
      resolve: "gatsby-plugin-lodash",
      options: {
        disableFeatures: ["cloning"],
      },
    },
    {
      resolve: "gatsby-plugin-react-svg",
      options: {
        rule: {
          include: /static/,
        },
      },
    },
  ],
}
