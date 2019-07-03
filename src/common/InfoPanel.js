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
        headerText="SwarmBin"
        closeButtonAriaLabel="Close"
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>
            Swarmbin is a simple and secure way to share code snippets and
            pastes with others. All pastes are encrypted and upload to Swarm
          </span>
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
