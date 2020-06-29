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
    title: 'mdwyer.io',
    description: 'mdwyer\'s personal site',
    contact: {
      github: 'https://github.com/m-dwyer',
      strava: 'https://www.strava.com/athletes/thatmd'
    }
  },
  plugins: [
    'gatsby-plugin-emotion',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: `${__dirname}/content/pages/`
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'posts',
        path: `${__dirname}/content/posts`
      }
    },
    'gatsby-transformer-remark',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'mdwyerio',
        short_name: 'mdwyerio',
        start_url: '/',
        background_color: '#323232',
        theme_color: '#cb4ec7',
        display: 'standalone',
        icon: 'src/images/icon.png'
      }
    }
  ]
};