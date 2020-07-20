import React from "react";
import { css } from "@emotion/core";

class IndexSection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { forwardedRef, children, ...props } = this.props;

    const ReferencedSection = React.forwardRef((props, ref) => {
      return (
        <section
          css={css`
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            justify-content: center;
            align-items: center;
            margin: auto;
        `}
          ref={ref} {...props}>
          <div css={css`
            max-width: 90%;
            margin: 6rem auto 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          `}>
          {props.children}
          </div>
        </section>
    )});

    return (
      <ReferencedSection ref={forwardedRef} {...props}>
        {children}
      </ReferencedSection>
    );
  }
}

export default IndexSection;