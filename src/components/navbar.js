import React from "react";
import { Link } from "gatsby";
import { css } from "@emotion/core";

export default function Layout({ children }) {
  const navItemStyle = theme => css`
    padding: 24px;
    text-decoration: none;
    color: ${theme.colors.fgColor};
    &:hover {
      color: ${theme.colors.fontColor};
    }
`;

  return (
    <nav>
      <ul css={css`
        display: flex;
        justify-content: flex-end;
        list-style-type: none;
      `}>
        <li><Link to="/" css={navItemStyle}>Home</Link></li>
        <li><Link to="/blog"css={navItemStyle}>Blog</Link></li>
      </ul>
    </nav>
  );
}