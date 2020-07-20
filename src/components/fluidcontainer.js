import React from "react";
import { css } from "@emotion/core";

export default function FluidContainer({ children }) {
  return (
    <div css={css`
    margin-left: auto;
    margin-right: auto;
    background-color: pink;
    padding: 2.5rem 1.3rem;
    max-width: 42rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `}>
    {children}
    </div>
  );
}