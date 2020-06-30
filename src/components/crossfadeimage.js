import React from "react";
import { css } from "@emotion/core";

export default function CrossfadeImage({children, ...props}) {
  return (
    <div css={css`
      display: flex;
      align-items: center;
      justify-content: center;
      flex-flow: row nowrap;

      @keyframes crossfade {
        0% {
          opacity: 100%;
        }

        100% {
          opacity: 0%;
        }
      }

      .cf-fg {
        position: absolute;
      }

      .cf-fg:hover {
        animation-name: crossfade;
        animation-duration: 1s;
        animation-fill-mode: forwards;
      }
    `} {...props}>
      {children}
    </div>
  );
}