import React, { Component } from 'react'
import { DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'

class InfoPanel extends Component {
  render() {
    return (
      <Panel
        isBlocking={false}
        isOpen={this.props.isOpen}
        type={PanelType.smallFluid}
        onDismiss={this.props.onDismiss}
        headerText=""
        closeButtonAriaLabel="Close"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            fontSize: '1.25em',
          }}
        >
          <p>
            <strong>SwarmBin</strong> is a simple and secure way to share code
            snippets and pastes with others.
          </p>
          <p>
            Data is AES 256-bit encrypted and uploaded to{' '}
            <a href="https://swarm.ethereum.org/" target="_blank">
              Swarm
            </a>. This project is modeled after ZeroBin, originally developed by{' '}
            <a href="https://github.com/sebsauvage/ZeroBin">
              Sébastien Sauvage
            </a>.
          </p>
          <div>
            <DefaultButton
              style={{ marginTop: 15 }}
              primary
              data-automation-id="test"
              text="Close"
              onClick={this.props.onDismiss}
            />
          </div>
        </div>
      </Panel>
    )
  }
}

export default InfoPanel
