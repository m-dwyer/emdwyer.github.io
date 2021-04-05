import React from "react"
import Layout from "../components/layout"

const Page = ({ childen, ...props }) => {
  return <Layout {...props}>{children}</Layout>
}

export default Page
