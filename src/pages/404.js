import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import FluidContainer from "../components/fluidcontainer"

const NotFoundPage = () => {
  return (
    <FluidContainer>
      <h1>Whoops..</h1>
      <p>
        It looks like you tried to access a route that doesn&#39;t exist.. Ouch.
      </p>
      <p>
        You should maybe consider <Link to="/">heading home</Link>
      </p>
    </FluidContainer>
  )
}

NotFoundPage.Layout = Layout
export default NotFoundPage
