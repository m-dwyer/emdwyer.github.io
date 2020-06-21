import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";
import { css, Global } from "@emotion/core";

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
  
            section {
              display: flex;
              flex-direction: column;
              width: 100%;
              height: 100vh;
              justify-content: center;
              align-items: center;
              margin: 0;
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
          <div css={css`padding: 15px; color: ${fgColor}`}>
            mdwyer
          </div>
          <nav css={css`
            display: flex;
            justify-content: flex-end;
          `}>
            { 
              data.allFile.nodes.map(({childMarkdownRemark}) => {
                console.log(childMarkdownRemark.frontmatter.title);
                return <Link
                          to="#"
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