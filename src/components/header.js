import React from "react";
import { css } from "@emotion/core";

export default function Header({ logo, children }) {
  return (
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
        {logo}
        <div css={css`
          margin: 0 15px;
        `}>mdwyer</div>
      </div>
      {children}
    </header>
  );
}