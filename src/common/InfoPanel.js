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
        headerText="BLOCKPASTE"
        closeButtonAriaLabel="Close"
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>BLOCKPASTE, your platform for everything Ethereum.</span>
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
