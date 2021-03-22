import React, { useReducer, createContext } from "react"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"
import { css } from "@emotion/core"
import { ThemeProvider } from "emotion-theming"
import NavBar from "./navbar"
import Header from "./header"
import Crossfade from "./crossfade"
import GlobalStyles from "./globalstyles"

import { motion } from "framer-motion"

export const NavContext = createContext()

const Layout = ({ children }) => {
  const data = useStaticQuery(
    graphql`
      query {
        allFile(
          filter: {
            internal: { mediaType: { eq: "text/markdown" } }
            sourceInstanceName: { eq: "pages" }
          }
        ) {
          nodes {
            childMarkdownRemark {
              excerpt
              frontmatter {
                title
              }
              html
              fields {
                slug
              }
            }
          }
        }
        logo: file(
          relativePath: { eq: "icon.png" }
          sourceInstanceName: { eq: "images" }
        ) {
          childImageSharp {
            fixed(width: 35, height: 35) {
              base64
              width
              height
              src
              srcSet
            }
          }
        }
        avatar: file(
          relativePath: { eq: "avatar.jpg" }
          sourceInstanceName: { eq: "images" }
        ) {
          childImageSharp {
            fixed(width: 35, height: 35) {
              base64
              width
              height
              src
              srcSet
            }
          }
        }
      }
    `
  )

  const theme = {
    colors: {
      fontColor: "hsl(0, 0%, 90%)",
      bgColor: "hsl(0, 0%, 14%)",
      altBgColor: "hsl(0, 5%, 14%)",
      altBgColor2: "hsl(0, 0%, 14%)",
      fgColor: "hsl(0, 0%, 70%)",
      secondaryBgColor: "hsl(275,59%,47%)",
    },
  }

  const backgroundLogo = (
    <Img
      fixed={data.avatar.childImageSharp.fixed}
      css={css`
        border-radius: 50%;
      `}
    />
  )

  const foregroundLogo = (
    <Img
      fixed={data.logo.childImageSharp.fixed}
      css={css`
        border-radius: 50%;
      `}
    />
  )

  const logo = (
    <Crossfade background={backgroundLogo} foreground={foregroundLogo} />
  )

  const reducer = (state, item) => {
    return [...state, item]
  }

  const [navItems, setNavItems] = useReducer(reducer, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <NavContext.Provider value={{ navItems, setNavItems }}>
        <Header logo={logo}>
          <NavBar />
        </Header>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          css={theme => css`
            > section:nth-child(1n) {
              background-color: ${theme.colors.altBgColor};
            }

            > section:nth-child(2n) {
              background-color: ${theme.colors.altBgColor2};
            }
          `}
        >
          {children}
        </motion.main>
      </NavContext.Provider>
    </ThemeProvider>
  )
}

export default Layout
