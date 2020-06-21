import React from "react";
import { Link } from "gatsby";
import { css } from "@emotion/core";

import avatar from '../images/avatar.jpg';

export default function Home({ data }) {
  const bgColor = 'hsl(275,59%,47%)';
  const fgColor = 'hsl(0, 0%, 90%)';

  const navItemStyle = css`
    padding: 15px;
    text-decoration: none;
    color: ${fgColor}
  `;

  return (
    <header
      css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          top: 0;
          left: 0;
          margin: 0;
          background-color: ${bgColor}
        `}
    >
      <div css={css`padding: 15px; color: ${fgColor}`}>
        mdwyer
      </div>
      <nav css={css`
        display: flex;
        justify-content: flex-end;
      `}>
        <Link to="/about" css={navItemStyle}>About</Link>
        <Link to="/contact" css={navItemStyle}>Contact</Link>
        <Link to="/blog" css={navItemStyle}>Blog</Link>
      </nav>
    </header>
  );
}