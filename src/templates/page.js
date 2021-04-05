import React from "react"
import Layout from "../components/layout"
import IndexSection from "../components/indexsection"

const Page = ({ data }) => {
  const content = data.markdownRemark
  return (
    <Layout>
      <IndexSection>
        <h1>{content.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      </IndexSection>
    </Layout>
  )
}

export default Page
