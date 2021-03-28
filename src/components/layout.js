import React, { useReducer, createContext } from "react"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"
import { css, ThemeProvider } from "@emotion/react"
import NavBar from "./navbar"
import Header from "./header"
import Crossfade from "./crossfade"
import GlobalStyles from "./globalstyles"

export const NavContext = createContext()
export const LayoutContext = createContext()

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
      highlightColor: "hsl(300,100%,78%)",
    },
  }

  const avatar = (
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

  const logo = <Crossfade background={avatar} foreground={foregroundLogo} />

  const reducer = (state, item) => {
    return [...state, item]
  }

  const [navItems, setNavItems] = useReducer(reducer, [])

  return (
    <LayoutContext.Provider value={{ avatar }}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <NavContext.Provider value={{ navItems, setNavItems }}>
          <Header logo={logo}>
            <NavBar />
          </Header>
          <main
            css={css`
              > section:nth-child(1n) {
                background-color: ${theme.colors.altBgColor};
              }

              > section:nth-child(2n) {
                background-color: ${theme.colors.altBgColor2};
              }
            `}
          >
            {children}
          </main>
        </NavContext.Provider>
      </ThemeProvider>
    </LayoutContext.Provider>
  )
}

export default Layout
