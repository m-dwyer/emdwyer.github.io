import React, { createContext } from "react"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"
import { css, ThemeProvider } from "@emotion/react"
import NavBar from "./navbar"
import Header from "./header"
import GlobalStyles from "./globalstyles"
import Body from "./body"
import Footer from "./footer"

import { FaGithub, FaLinkedin } from "react-icons/fa"

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

  const logo = (
    <Img
      fixed={data.logo.childImageSharp.fixed}
      css={css`
        border-radius: 50%;
      `}
    />
  )

  return (
    <LayoutContext.Provider value={{ avatar }}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <div
          css={css`
            display: grid;
            height: 100vh;
            width: 100%;
            grid-template-rows: max-content auto max-content;
            grid-template-columns: auto;
          `}
        >
          <Header>
            <div>{logo}</div>
            <div>{avatar}</div>
          </Header>
          <Body>
            <NavBar />
            <main
              css={css`
                overflow-y: scroll;
              `}
            >
              {children}
            </main>
          </Body>
          <Footer
            css={css`
              background: ${theme.colors.altBgColor};
              grid-area: 3/1/4/2;
            `}
          >
            <FaGithub size={60} />
            <FaLinkedin size={60} />
          </Footer>
        </div>
      </ThemeProvider>
    </LayoutContext.Provider>
  )
}

export default Layout
