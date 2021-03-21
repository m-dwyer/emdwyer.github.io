import React from "react"
import { css } from "@emotion/core"

const Crossfade = ({ background, foreground, ...props }) => {
  return (
    <div
      css={css`
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

        .crossfade-fg {
          position: absolute;
        }

        .crossfade-fg:hover {
          animation-name: crossfade;
          animation-duration: 1s;
          animation-fill-mode: forwards;
        }
      `}
      {...props}
    >
      <div className="crossfade-bg">{background}</div>
      <div className="crossfade-fg">{foreground}</div>
    </div>
  )
}

export default Crossfade
