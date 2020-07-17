import React from "react";
import { css } from "@emotion/core";

class ScrollIndicator extends React.Component {
  constructor(props) {
    super(props);

    this.scrollToContent = this.scrollToContent.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    this.state = {
      sections: props.sectionRefs,
      currentSection: null
    }
  }

  scrollToContent(ref) {
    ref.current.scrollIntoView({ block: "start", behavior: "smooth" });
  }


  handleScroll() {
    let currentSection = this.state.sections[0];

    for (let i = 0; i < this.state.sections.length; i++) {
      if (window.pageYOffset > this.state.sections[i].current.offsetTop) {
        currentSection = this.state.sections[i];
      }
    }

    this.setState({
      currentSection: currentSection
    });
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
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
        ${'' /* right: -9vw; */}
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
              ${'' /* right: -9vw; */}
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

      `}>
      {
        this.state.sections.map((section, idx) => {
          let color = section === this.state.currentSection ?
                        'green' : 'red'
          return (
            <ReferencedScrollItem
              key={idx}
              ref={section}
              css={css`
                background-color: ${color}
              `}
              {...this.props}
            />
          );
        })
      }
      </div>
    );
  }
}

export default ScrollIndicator;