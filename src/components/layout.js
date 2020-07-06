import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Img from "gatsby-image";
import { css, Global } from "@emotion/core";
import { ThemeProvider } from "emotion-theming";
import Crossfade from "./crossfade";
import NavBar from "./navbar";

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
  
    return (
      <ThemeProvider theme={theme}>
        <Global
          styles={theme => css`
            @font-face {
              font-family: 'Ubuntu';
              src: url('https://fonts.googleapis.com/css2?family=Ubuntu&display=swap');
            }

            body {
              font-family: 'Ubuntu', sans-serif;
              margin: 0;
              background-color: ${theme.colors.bgColor};
              color: ${theme.colors.fontColor};
              padding-top: 1vh;
            }
  
            .index-section {
              display: flex;
              flex-direction: column;
              width: 80vw;
              height: 100vh;
              justify-content: center;
              align-items: center;
              margin: 0 auto;
            }

            h1 {
              font-weight: 600;
              font-size: 4rem;
              text-align: center;
            }

            .link {
              color: inherit;
              text-decoration: none;
            }
          `}
        />
        <header css={
          theme => css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            top: 0;
            left: 0;
            margin: 0;
            background-color: ${theme.colors.secondaryBgColor};
            position: fixed;
            width: 100%;
            max-height: 20vh;
          `}>
          <div css={
            theme => css`
              padding: 10px;
              color: ${theme.colors.fontColor};
              display: flex;
              justify-content: center;
              align-items: center;
          `}>
            <Crossfade
              background={backgroundLogo}
              foreground={foregroundLogo}
            />
            <div css={css`
              margin: 0 15px;
            `}>mdwyer</div>
          </div>
          <NavBar />
        </header>
        <main>
            {children}
        </main>
      </ThemeProvider>
    );
}