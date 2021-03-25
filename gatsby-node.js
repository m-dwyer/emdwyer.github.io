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
              tags
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

  let tags = new Set()

  result.data.posts.edges.forEach(edge => {
    const { node, next = null, previous = null } = edge

    if (node.frontmatter.tags) {
      node.frontmatter.tags.forEach(t => tags.add(t.toLowerCase()))
      console.log("tags", tags)
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

  tags.forEach(t => {
    createPage({
      path: `/tag/${t}`,
      component: path.resolve("./src/templates/tag.js"),
      context: {
        tag: t,
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
