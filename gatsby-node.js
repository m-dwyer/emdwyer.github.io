const { createFilePath } = require("gatsby-source-filesystem")
const { paginate } = require("gatsby-awesome-pagination")
const path = require("path")

exports.onCreateNode = ({ node, getNode, actions }) => {
  if (node.internal.type == "MarkdownRemark") {
    const sourcePaths = {
      blog: "/blog",
    }

    const fileNode = getNode(node.parent)
    const source = fileNode.sourceInstanceName
    const { createNodeField } = actions
    const slug = createFilePath({ node, getNode })
    createNodeField({
      node,
      name: "slug",
      value: `${sourcePaths[source] ?? ""}${slug}`,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const result = await graphql(`
    query {
      posts: allMarkdownRemark(
        sort: { fields: frontmatter___date, order: DESC }
      ) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              category
            }
          }
          next {
            fields {
              slug
            }
            frontmatter {
              title
            }
          }
          previous {
            fields {
              slug
            }
            frontmatter {
              title
            }
          }
        }
      }
    }
  `)

  let categories = new Set()

  result.data.posts.edges.forEach(edge => {
    const { node, next = null, previous = null } = edge

    if (node.frontmatter.category) {
      categories.add(node.frontmatter.category.toLowerCase())
    }

    createPage({
      path: node.fields.slug,
      component: path.resolve("./src/templates/blog-post.js"),
      context: {
        slug: node.fields.slug,
        next,
        previous,
      },
    })
  })

  categories.forEach(c => {
    createPage({
      path: `/category/${c}`,
      component: path.resolve("./src/templates/category.js"),
      context: {
        category: c,
      },
    })
  })

  paginate({
    createPage,
    items: result.data.posts.edges,
    itemsPerPage: 5,
    pathPrefix: "/blog",
    component: path.resolve("./src/templates/blog-list.js"),
  })
}
