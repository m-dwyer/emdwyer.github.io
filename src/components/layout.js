import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Img from "gatsby-image";
import { css, Global } from "@emotion/core";
import { ThemeProvider } from "emotion-theming";
import NavBar from "./navbar";
import Header from "./header";
import Crossfade from "./crossfade";

export default function Layout({ children }) {
  const data = useStaticQuery(
    graphql`
      query {
        allFile(
          filter: {
            internal: {mediaType: {eq: "text/markdown"}},
            sourceInstanceName: {eq: "pages"}
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
        logo: file(relativePath: {eq: "icon.png"}, sourceInstanceName: {eq: "images"}) {
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
        avatar: file(relativePath: {eq: "avatar.jpg"}, sourceInstanceName: {eq: "images"}) {
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
  );
    
  const theme = {
    colors: {
      fontColor: 'hsl(0, 0%, 90%)',
      bgColor: 'hsl(0, 0%, 14%)',
      altBgColor: 'hsl(0, 5%, 14%)',
      altBgColor2: 'hsl(0, 0%, 14%)',
      fgColor: 'hsl(0, 0%, 70%)',
      secondaryBgColor: 'hsl(275,59%,47%)'
    }
  }

  const backgroundLogo =
    <Img
      fixed={data.avatar.childImageSharp.fixed}
      css={css`border-radius: 50%;`}
    />;

  const foregroundLogo =
    <Img
      fixed={data.logo.childImageSharp.fixed}
      css={css`border-radius: 50%;`}
    />;

  const logo = <Crossfade
                  background={backgroundLogo}
                  foreground={foregroundLogo}
                />;

  return (
    <ThemeProvider theme={theme}>
      <Global
        styles={theme => css`
          @font-face {
            font-family: 'Ubuntu';
            src: url('https://fonts.googleapis.com/css2?family=Ubuntu&display=swap');
          }

          html, body {
            margin: 0;
            padding: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Ubuntu', sans-serif;
            background-color: ${theme.colors.bgColor};
            color: ${theme.colors.fontColor};
          }

          h1 {
            font-weight: 600;
            font-size: 4rem;
            text-align: center;
          }

          a {
            color: inherit;
          }
        `}
      />
      <Header logo={logo}>
        <NavBar />
      </Header>
      <main css={theme => css`
        section:nth-child(1n) {
          background-color: ${theme.colors.altBgColor};
        }

        section:nth-child(2n) {
          background-color: ${theme.colors.altBgColor2};
        }
      `}>
          {children}
      </main>
    </ThemeProvider>
  );
}