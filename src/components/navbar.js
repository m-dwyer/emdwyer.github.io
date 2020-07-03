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
    <nav css={css`
      display: flex;
      justify-content: flex-end;
    `}>
      <Link to="/" css={navItemStyle}>Home</Link>
      <Link to="/blog"css={navItemStyle}>Blog</Link>
    </nav>
  );
}