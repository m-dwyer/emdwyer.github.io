import React, { useEffect, useState } from "react"
import { css } from "@emotion/core"

const ScrollIndicator = props => {
  const [state, setState] = useState({
    sections: props.sectionRefs,
    currentSection: null,
  })

  const scrollToContent = ref => {
    ref.current.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  const handleScroll = () => {
    let currentSection = this.state.sections[0]

    for (let i = 0; i < this.state.sections.length; i++) {
      if (window.pageYOffset > this.state.sections[i].current.offsetTop) {
        currentSection = this.state.sections[i]
      }
    }

    setState({
      currentSection: currentSection,
    })
  }

  useEffect(() => {
    window.onscroll = handleScroll
  }, [])

  const ReferencedScrollItem = React.forwardRef((props, ref) => {
    return (
      <span
        css={css`
          height: 20px;
          width: 20px;
          background-color: red;
          border-radius: 50%;
        `}
        onClick={() => scrollToContent(ref)}
        {...props}
      >
        {props.children}
      </span>
    )
  })

  return (
    <div
      css={css`
        position: fixed;
        ${"" /* right: -9vw; */}
        right: 0vw;
        width: 10vw;
        border: 2px red solid;
        top: 50%;
        display: flex;
        flex-direction: column;
        height: 30vh;
        justify-content: space-around;
        align-items: center;

        :hover {
          @keyframes show-sidebar {
            0% {
              right: 0vw;
              ${"" /* right: -9vw; */}
            }

            100% {
              right: 0vw;
            }
          }

          animation-name: show-sidebar;
          animation-duration: 2s;
          animation-fill-mode: both;
          animation-iteration-count: 1;
        }

        .pulsing-point {
          animation: pulsing-point 1s infinite;
        }

        @keyframes pulsing-point {
          0% {
            transform: scale(0.8);
          }

          50% {
            transform: scale(1);
          }

          100% {
            transform: scale(0.8);
          }
        }
      `}
    >
      {state.sections.map((section, idx) => {
        let color = section === state.currentSection ? "green" : "red"

        let pulsingClass =
          section === state.currentSection ? "pulsing-point" : ""
        return (
          <ReferencedScrollItem
            key={idx}
            ref={section}
            css={css`
              background-color: ${color};
            `}
            className={pulsingClass}
            {...props}
          />
        )
      })}
    </div>
  )
}

export default ScrollIndicator
