import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";
import Img from "gatsby-image";
import { css, Global } from "@emotion/core";
import Crossfade from "./crossfade";

export default function Layout({ children }) {
    const data = useStaticQuery(
        graphql`
          query {
            allFile(filter: {internal: {mediaType: {eq: "text/markdown"}}, sourceInstanceName: {eq: "pages"}}) {
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
    
    const navBgColor = 'hsl(275,59%,47%)';
    const bgColor = 'hsl(0, 0%, 14%)';
    const fgColor = 'hsl(0, 0%, 70%)';
    const mainFontColor = 'hsl(0, 0%, 90%)'
    const fgHighlightedColor = mainFontColor;
  
    const navItemStyle = css`
      padding: 24px;
      text-decoration: none;
      color: ${fgColor};
      &:hover {
        color: ${fgHighlightedColor};
      }
    `;

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
        <div>
        <Global
          styles={css`
            body {
              margin: 0;
              background-color: ${bgColor};
              color: ${mainFontColor}; 
            }
  
            @font-face {
              font-family: 'Ubuntu';
              src: url('https://fonts.googleapis.com/css2?family=Raleway&display=swap');
            }
  
            .index-section {
              display: flex;
              flex-direction: column;
              width: 100%;
              height: 100vh;
              justify-content: center;
              align-items: center;
              margin: 0;
            }

            .link {
              color: inherit;
              text-decoration: none;
            }

            h1 {
              font-family: 'Ubuntu', sans-serif;
              font-weight: 600;
              font-size: 4rem;
            }
          `}
        />
        <header
          css={css`
              display: flex;
              justify-content: space-between;
              align-items: center;
              top: 0;
              left: 0;
              margin: 0;
              background-color: ${navBgColor};
              position: fixed;
              width: 100%;
            `}
        >
          <div css={css`
            padding: 10px;
            color: ${fgColor};
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
          <nav css={css`
            display: flex;
            justify-content: flex-end;
          `}>
            <Link to="/" css={navItemStyle}>Home</Link>
            {
              data.allFile.nodes.map(({childMarkdownRemark}) => {
                return <Link
                          key={childMarkdownRemark.fields.slug}
                          to={childMarkdownRemark.fields.slug}
                          css={navItemStyle}
                        >{childMarkdownRemark.frontmatter.title}</Link>
              })
            }
          </nav>
        </header>
        <main>
            {children}
        </main>
      </div>
    );
}