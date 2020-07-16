import React from "react";
import { css } from "@emotion/core";

class SectionScroll extends React.Component {
  constructor(props) {
    super(props);

    this.scrollToContent = this.scrollToContent.bind(this);
  }

  scrollToContent(ref) {
    ref.current.scrollIntoView({ block: "start", behavior: "smooth" });
    console.log(ref);
  }

  render() {
    const ReferencedScrollItem = React.forwardRef((props, ref) => {
      return (
        <span
          css={css`
            height: 20px;
            width: 20px;
            background-color: red;
            border-radius: 50%;
          `}
          onClick={() => this.scrollToContent(ref)}
          {...props}
        >
          {props.children}
        </span>
    )});

    return (
      <div css={css`
        position: fixed;
        right: 0;
        width: 10vw;
        border: 2px red solid;
        top: 50%;
        display: flex;
        flex-direction: column;
        height: 30vh;
        justify-content: space-around;
        align-items: center;
      `}>
      {
        this.props.sectionRefs.map(section => {
          return <ReferencedScrollItem ref={section} {...this.props}>

          </ReferencedScrollItem>;
        })
      }
      </div>
    );
  }
}

export default SectionScroll;